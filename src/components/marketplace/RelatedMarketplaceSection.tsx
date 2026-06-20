"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRelatedMarketplaceProfiles } from "@/services/marketplaceBrowseService";
import type { MarketplaceProfile } from "@/types/marketplace";

type Props = {
  variant: "technical" | "spare";
  current: MarketplaceProfile;
  listPath: string;
};

function RelatedMarketplaceCard({ item, basePath }: { item: MarketplaceProfile; basePath: string }) {
  return (
    <Link
      href={`${basePath}/${item.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[10px] border border-[#dbe2ea] bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <img
        src={item.images[0] ?? "/banner_1.jpg"}
        alt={item.name}
        className="h-32 w-full rounded-[8px] bg-[#f4f6f9] object-cover sm:h-36"
      />
      <div className="flex flex-1 flex-col pt-2">
        <h3 className="line-clamp-2 text-sm font-black leading-tight text-[#0F2A4A] sm:text-base">
          {item.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-[#5f6f86]">{item.title}</p>
        <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-[#7A8CA5] sm:text-xs">
          <span className="rounded-full bg-[#edf1f6] px-2 py-1">{item.city}</span>
          <span className="rounded-full bg-[#edf1f6] px-2 py-1">{item.district}</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <p className="line-clamp-1 text-xs font-extrabold text-[#0F2A4A] sm:text-sm">{item.expertise}</p>
          <span className="rounded-[8px] bg-[#F26A1B] px-2 py-1 text-[10px] font-bold text-white sm:px-3 sm:py-1.5 sm:text-xs">
            İncele
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function RelatedMarketplaceSection({ variant, current, listPath }: Props) {
  const [items, setItems] = useState<MarketplaceProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void getRelatedMarketplaceProfiles(variant, current, 4)
      .then((results) => {
        if (!cancelled) setItems(results);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [variant, current.id, current.slug, current.category, current.partCategory, current.serviceType]);

  if (!loading && items.length === 0) return null;

  const categoryLabel =
    variant === "spare"
      ? current.partCategory ?? current.category
      : current.serviceType ?? current.category;

  return (
    <section className="mx-auto w-full max-w-7xl border-t border-[#e8edf3] px-4 pb-8 pt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-[#0F2A4A] sm:text-xl">Aynı kategoriden diğer ilanlar</h2>
          {categoryLabel ? <p className="mt-1 text-sm text-[#7A8CA5]">{categoryLabel}</p> : null}
        </div>
        <Link href={listPath} className="text-sm font-semibold text-[#F26A1B] transition hover:underline">
          Tümünü gör
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
          {items.map((item) => (
            <RelatedMarketplaceCard key={item.id} item={item} basePath={listPath} />
          ))}
        </div>
      )}
    </section>
  );
}
