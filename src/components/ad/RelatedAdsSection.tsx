"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRelatedAds } from "@/services/adService";
import { formatPrice } from "@/lib/utils/format";
import type { Ad } from "@/types/ad";

type Props = {
  adId: string;
  category: string;
};

function RelatedAdCard({ ad }: { ad: Ad }) {
  const image = ad.images?.[0] ?? "/banner_1.jpg";
  const location = [ad.city, ad.district].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/ilan/${ad.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[10px] border border-[#dbe2ea] bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <img
        src={image}
        alt={ad.title}
        className="h-32 w-full rounded-[8px] bg-[#f4f6f9] object-cover sm:h-36"
      />
      <div className="flex flex-1 flex-col pt-2">
        <h3 className="line-clamp-2 text-sm font-black leading-tight text-[#0F2A4A] sm:text-base">
          {ad.title}
        </h3>
        <div className="mt-1 flex flex-wrap gap-x-2 text-xs font-semibold text-[#1f334e]">
          {ad.year ? <span>{ad.year}</span> : null}
          {ad.axisCount ? <span>{ad.axisCount}</span> : null}
        </div>
        {location ? (
          <p className="mt-1 line-clamp-1 text-[10px] text-[#7A8CA5] sm:text-xs">{location}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <p className="text-xs font-extrabold text-[#0F2A4A] sm:text-sm">
            {formatPrice(ad.price, ad.currency)}
          </p>
          <span className="rounded-[8px] bg-[#F26A1B] px-2 py-1 text-[10px] font-bold text-white sm:px-3 sm:py-1.5 sm:text-xs">
            İncele
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function RelatedAdsSection({ adId, category }: Props) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void getRelatedAds(adId, category, 4)
      .then((items) => {
        if (!cancelled) setAds(items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [adId, category]);

  if (!loading && ads.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl border-t border-[#e8edf3] px-4 pb-8 pt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-[#0F2A4A] sm:text-xl">Aynı kategoriden diğer ilanlar</h2>
          {category ? (
            <p className="mt-1 text-sm text-[#7A8CA5]">{category}</p>
          ) : null}
        </div>
        <Link
          href="/ilanlar"
          className="text-sm font-semibold text-[#F26A1B] transition hover:underline"
        >
          Tüm ilanlar
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-[10px] border border-[#dbe2ea] bg-[#f4f6f9]"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {ads.map((item) => (
            <RelatedAdCard key={item.id} ad={item} />
          ))}
        </div>
      )}
    </section>
  );
}
