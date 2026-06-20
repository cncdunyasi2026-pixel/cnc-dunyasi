"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { fetchFavorites, removeFavorite } from "@/services/favoritesService";
import type { FavoriteItem, FavoriteKind } from "@/services/favoritesService";

const KIND_LABELS: Record<FavoriteKind, string> = {
  ads: "İkinci El CNC",
  technical_service_listings: "Teknik Servis",
  spare_part_listings: "Yedek Parça",
  job_listings: "Kariyer",
};

function fmtDate(ms: number) {
  if (!ms) return "";
  return new Date(ms).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function FavorilerPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/hesap/giris?redirect=/hesap/favoriler`);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchFavorites(user.uid)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  const handleRemove = async (item: FavoriteItem) => {
    if (!user) return;
    setRemovingKey(item.key);
    try {
      await removeFavorite(user.uid, item.kind, item.id);
      setItems((prev) => prev.filter((i) => i.key !== item.key));
    } finally {
      setRemovingKey(null);
    }
  };

  if (authLoading || (!user && !loading)) {
    return (
      <div className="mx-auto flex max-w-4xl justify-center px-4 py-16">
        <p className="text-sm font-semibold text-[#7A8CA5]">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[#7A8CA5]">HESABIM</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#0F2A4A] md:text-3xl">Favorilerim</h1>
          <p className="mt-2 max-w-xl text-sm text-[#5f6f86]">
            Beğendiğin ilanları buradan takip edebilirsin.
          </p>
        </div>
        <Link
          href="/ilanlar"
          className="inline-flex justify-center rounded-xl border border-[#dbe2ea] bg-white px-4 py-3 text-sm font-bold text-[#0F2A4A] transition hover:border-[#0F2A4A]"
        >
          İlanlara göz at
        </Link>
      </div>

      {/* ── Loading ─────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-[#e5eaf0]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        /* ── Empty state ────────────────────────────────────── */
        <div className="rounded-2xl border border-[#dbe2ea] bg-[#f8fafc] px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
            <HeartEmptyIcon />
          </div>
          <p className="text-base font-bold text-[#0F2A4A]">Henüz favori yok</p>
          <p className="mt-2 text-sm text-[#5f6f86]">
            İlan, servis veya iş ilanlarında kalp simgesine tıklayarak favorine ekleyebilirsin.
          </p>
          <Link
            href="/ilanlar"
            className="mt-6 inline-flex rounded-xl bg-[#F26A1B] px-6 py-3 text-sm font-bold !text-white visited:!text-white hover:!text-white"
          >
            İlanları keşfet
          </Link>
        </div>
      ) : (
        /* ── List ───────────────────────────────────────────── */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.key}
              className="group relative overflow-hidden rounded-xl border border-[#dbe2ea] bg-white shadow-sm transition hover:shadow-md"
            >
              <Link href={item.href} className="flex gap-0">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-28 w-28 shrink-0 object-cover"
                />
                <div className="min-w-0 flex-1 px-3 py-3">
                  <span className="mb-1 inline-block rounded-full border border-[#dbe2ea] px-2 py-0.5 text-[10px] font-bold text-[#7A8CA5]">
                    {KIND_LABELS[item.kind]}
                  </span>
                  <p className="line-clamp-2 text-sm font-bold leading-snug text-[#0F2A4A] group-hover:text-[#F26A1B]">
                    {item.title}
                  </p>
                  {item.addedAt > 0 && (
                    <p className="mt-1 text-[11px] text-[#7A8CA5]">
                      Eklenme: {fmtDate(item.addedAt)}
                    </p>
                  )}
                </div>
              </Link>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(item)}
                disabled={removingKey === item.key}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-rose-400 shadow-sm transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                title="Favorilerden kaldır"
              >
                {removingKey === item.key ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-rose-300 border-t-rose-600" />
                ) : (
                  <HeartFilledIcon />
                )}
              </button>
            </article>
          ))}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-[#7A8CA5] md:text-left">
        <Link href="/hesap/profil" className="font-semibold hover:text-[#0F2A4A]">
          ← Profil&apos;e dön
        </Link>
      </p>
    </div>
  );
}

function HeartEmptyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7 text-rose-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

function HeartFilledIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
    </svg>
  );
}
