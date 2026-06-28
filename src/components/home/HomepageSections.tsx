"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db, isFirebaseClientConfigured } from "@/lib/firebase";
import { mapAdSnapshotToAd } from "@/lib/firestore/mapAdDoc";
import { mapMarketplaceDocToProfile } from "@/lib/firestore/mapMarketplaceDoc";
import { mapJobListingFromFirestore } from "@/lib/firestore/mapJobDoc";
import { formatPrice } from "@/lib/utils/format";
import { imageLoadHints, prefetchListingImages } from "@/lib/utils/imageLoading";
import { fetchWithBrowserCache, readBrowserCache } from "@/lib/cache/browserCache";
import { CACHE_POLICIES } from "@/lib/cache/policies";
import MarketplaceCard from "@/components/marketplace/MarketplaceCard";
import JobCard from "@/components/jobs/JobCard";
import PageContentSlot from "@/components/page/PageContentSlot";
import type { Ad } from "@/types/ad";
import type { MarketplaceProfile } from "@/types/marketplace";
import type { JobListing } from "@/types/job";

/* ── Types ──────────────────────────────────────────────────── */
type HomeData = {
  weeklyDeals: Ad[];
  featuredAds: Ad[];
  featuredServices: MarketplaceProfile[];
  featuredParts: MarketplaceProfile[];
  featuredJobs: JobListing[];
};

/* ── Firestore helpers ──────────────────────────────────────── */

async function fetchAds(flagField: "weeklyDeal" | "isFeatured", n: number): Promise<Ad[]> {
  try {
    const flagged = await getDocs(
      query(
        collection(db, "ads"),
        where("status", "==", "published"),
        where(flagField, "==", true),
        orderBy("createdAt", "desc"),
        limit(n),
      ),
    );
    if (!flagged.empty) {
      return flagged.docs.map((d) => mapAdSnapshotToAd(d.id, d.data() as Record<string, unknown>));
    }
  } catch {
    // index yok veya sorgu hatası — aşağıdaki genel listeye düş
  }

  const snap = await getDocs(
    query(
      collection(db, "ads"),
      where("status", "==", "published"),
      orderBy("createdAt", "desc"),
      limit(n),
    ),
  );
  return snap.docs.map((d) => mapAdSnapshotToAd(d.id, d.data() as Record<string, unknown>));
}

async function fetchMarketplace(col: string, n: number): Promise<MarketplaceProfile[]> {
  try {
    const snap = await getDocs(
      query(
        collection(db, col),
        where("status", "==", "published"),
        where("isFeatured", "==", true),
        orderBy("createdAt", "desc"),
        limit(n),
      ),
    );
    if (!snap.empty) {
      return snap.docs.map((d) => mapMarketplaceDocToProfile(d.id, d.data() as Record<string, unknown>));
    }
  } catch {
    // index missing → fallback
  }
  const snap = await getDocs(
    query(
      collection(db, col),
      where("status", "==", "published"),
      orderBy("createdAt", "desc"),
      limit(n),
    ),
  );
  return snap.docs.map((d) => mapMarketplaceDocToProfile(d.id, d.data() as Record<string, unknown>));
}

async function fetchJobs(n: number): Promise<JobListing[]> {
  try {
    const snap = await getDocs(
      query(
        collection(db, "job_listings"),
        where("status", "==", "published"),
        where("isFeatured", "==", true),
        orderBy("createdAt", "desc"),
        limit(n),
      ),
    );
    if (!snap.empty) {
      return snap.docs.map((d) => mapJobListingFromFirestore(d.id, d.data() as Record<string, unknown>));
    }
  } catch {
    // index missing → fallback
  }
  const snap = await getDocs(
    query(
      collection(db, "job_listings"),
      where("status", "==", "published"),
      orderBy("createdAt", "desc"),
      limit(n),
    ),
  );
  return snap.docs.map((d) => mapJobListingFromFirestore(d.id, d.data() as Record<string, unknown>));
}

/* ── Component ──────────────────────────────────────────────── */

const HOME_SECTIONS_CACHE_KEY = "site:home-sections";

async function loadFromClientFirestore(): Promise<HomeData> {
  const [weeklyDeals, featuredAds, featuredServices, featuredParts, featuredJobs] =
    await Promise.all([
      fetchAds("weeklyDeal", 4),
      fetchAds("isFeatured", 4),
      fetchMarketplace("technical_service_listings", 4),
      fetchMarketplace("spare_part_listings", 4),
      fetchJobs(4),
    ]);
  return { weeklyDeals, featuredAds, featuredServices, featuredParts, featuredJobs };
}

function readCachedHomeSections(): HomeData | null {
  if (typeof window === "undefined") return null;
  const cached = readBrowserCache<HomeData>(HOME_SECTIONS_CACHE_KEY, CACHE_POLICIES.homeSections);
  return cached?.data ?? null;
}

export default function HomepageSections() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseClientConfigured) {
      setLoading(false);
      return;
    }

    const cached = readCachedHomeSections();
    if (cached) {
      setData(cached);
      setLoading(false);
    }

    let cancelled = false;
    void fetchWithBrowserCache(HOME_SECTIONS_CACHE_KEY, CACHE_POLICIES.homeSections, loadFromClientFirestore)
      .then(({ data: fresh, fromCache }) => {
        if (cancelled) return;
        setData(fresh);
        if (!fromCache) {
          prefetchListingImages(
            [
              ...fresh.weeklyDeals.map((ad) => ad.images[0]),
              ...fresh.featuredAds.map((ad) => ad.images[0]),
            ].filter((url): url is string => Boolean(url)),
            2,
          );
        }
      })
      .catch((e) => {
        console.error("[HomepageSections] fetch error:", e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !data) {
    return <HomepageSkeleton />;
  }

  if (!data || !isFirebaseClientConfigured) {
    return null;
  }

  const { weeklyDeals, featuredAds, featuredServices, featuredParts, featuredJobs } = data;

  let imageCounter = 0;

  return (
    <>
      <PageContentSlot pageId="home" slotId="above_weekly_deals" />

      {/* ── HAFTANIN FIRSATLARI ─────────────────────────── */}
      {weeklyDeals.length > 0 && (
        <section className="mx-auto mt-6 w-full max-w-7xl px-4">
          <h3 className="mb-3 text-xl font-extrabold text-[#0F2A4A] sm:text-2xl">
            HAFTANIN FIRSATLARI
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {weeklyDeals.map((ad) => {
              const hints = imageLoadHints(imageCounter++);
              return (
              <Link
                key={ad.id}
                href={`/ilan/${ad.id}`}
                className="w-full max-w-[330px] overflow-hidden rounded-[4px] bg-[#0F2A4A] shadow transition hover:opacity-95 sm:max-w-[320px]"
              >
                <article>
                  <img
                    src={ad.images[0] ?? "/banner_1.jpg"}
                    alt={ad.title}
                    className="h-44 w-full bg-white object-contain p-2"
                    {...hints}
                  />
                  <div className="p-2.5">
                    <p className="mb-1 text-sm font-semibold text-white">{ad.title}</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-white">{formatPrice(ad.price, ad.currency)}</p>
                      <span className="rounded-[4px] bg-[#F26A1B] px-3 py-1 text-xs font-semibold text-white">
                        İNCELE
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            );
            })}
          </div>
        </section>
      )}

      {/* ── ÖNE ÇIKANLAR ────────────────────────────────── */}
      <section className="mx-auto mt-6 w-full max-w-7xl px-4">
        <h3 className="mb-3 text-xl font-extrabold text-[#0F2A4A] sm:text-2xl">ÖNE ÇIKANLAR</h3>
        <div className="space-y-6">

          {/* İlanlar */}
          {featuredAds.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-base font-extrabold text-[#0F2A4A] sm:text-lg">İlanlar</h4>
                <Link href="/ilanlar" className="text-xs font-bold text-[#F26A1B]">TÜMÜ</Link>
              </div>
              <div className="rounded-xl border border-[#1a446f] bg-[#0F2A4A] p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {featuredAds.map((ad) => {
                    const hints = imageLoadHints(imageCounter++);
                    return (
                    <Link
                      key={ad.id}
                      href={`/ilan/${ad.id}`}
                      className="mx-auto block w-full max-w-[282px] overflow-hidden rounded-[10px] border border-[#dbe2ea] bg-white p-2 shadow-sm transition hover:shadow-md"
                    >
                      <img
                        src={ad.images[0] ?? "/banner_1.jpg"}
                        alt={ad.title}
                        className="h-28 w-full rounded-[8px] bg-[#f4f6f9] object-cover sm:h-36 md:h-44"
                        {...hints}
                      />
                      <div className="pt-2">
                        <h5 className="line-clamp-2 text-base font-black leading-tight text-[#0F2A4A]">
                          {ad.title}
                        </h5>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="text-xs font-extrabold text-[#0F2A4A] sm:text-sm">
                            {formatPrice(ad.price, ad.currency)}
                          </p>
                          <span className="rounded-[8px] bg-[#F26A1B] px-2 py-1 text-[10px] font-bold text-white sm:px-3 sm:py-1.5 sm:text-xs">
                            İNCELE
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                  })}
                </div>
              </div>
            </div>
          )}

          <PageContentSlot pageId="home" slotId="between_ads_and_services" />

          {/* Teknik Servisler */}
          {featuredServices.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-base font-extrabold text-[#0F2A4A] sm:text-lg">Teknik Servisler</h4>
                <Link href="/kategori/teknik-servis" className="text-xs font-bold text-[#F26A1B]">TÜMÜ</Link>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {featuredServices.map((item) => (
                  <MarketplaceCard
                    key={item.id}
                    item={item}
                    basePath="/kategori/teknik-servis"
                    viewMode="card"
                    singleImage
                    imageIndex={imageCounter++}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Yedek Parçacılar */}
          {featuredParts.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-base font-extrabold text-[#0F2A4A] sm:text-lg">Yedek Parçacılar</h4>
                <Link href="/kategori/yedek-parca" className="text-xs font-bold text-[#F26A1B]">TÜMÜ</Link>
              </div>
              <div className="rounded-xl border border-[#1a446f] bg-[#0F2A4A] p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {featuredParts.map((item) => (
                    <MarketplaceCard
                      key={item.id}
                      item={item}
                      basePath="/kategori/yedek-parca"
                      viewMode="card"
                      singleImage
                      imageIndex={imageCounter++}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* İş İlanları */}
          {featuredJobs.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-base font-extrabold text-[#0F2A4A] sm:text-lg">İş İlanları</h4>
                <Link href="/kariyer" className="text-xs font-bold text-[#F26A1B]">TÜMÜ</Link>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {featuredJobs.map((item) => (
                  <JobCard key={item.id} item={item} viewMode="card" imageIndex={imageCounter++} />
                ))}
              </div>
            </div>
          )}

          <PageContentSlot pageId="home" slotId="below_jobs" />

        </div>
      </section>
    </>
  );
}

/* ── Skeleton ───────────────────────────────────────────────── */

function HomepageSkeleton() {
  return (
    <>
      {/* Weekly deals skeleton */}
      <section className="mx-auto mt-6 w-full max-w-7xl px-4">
        <div className="mb-3 h-7 w-48 animate-pulse rounded-lg bg-[#dbe2ea]" />
        <div className="flex flex-wrap justify-center gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 w-full max-w-[320px] animate-pulse rounded-[4px] bg-[#e5eaf0]"
            />
          ))}
        </div>
      </section>

      {/* Featured section skeleton */}
      <section className="mx-auto mt-6 w-full max-w-7xl px-4">
        <div className="mb-3 h-7 w-36 animate-pulse rounded-lg bg-[#dbe2ea]" />
        <div className="space-y-6">
          {[1, 2].map((s) => (
            <div key={s}>
              <div className="mb-2 h-5 w-24 animate-pulse rounded bg-[#dbe2ea]" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-52 animate-pulse rounded-[10px] bg-[#e5eaf0]"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
