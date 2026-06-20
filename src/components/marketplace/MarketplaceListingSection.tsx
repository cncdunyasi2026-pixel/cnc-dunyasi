"use client";

import { useListingViewMode } from "@/hooks/useListingViewMode";
import type { MarketplaceProfile } from "@/types/marketplace";
import MarketplaceCard from "@/components/marketplace/MarketplaceCard";

type Props = {
  items: MarketplaceProfile[];
  basePath: string;
};

export default function MarketplaceListingSection({ items, basePath }: Props) {
  const { viewMode, setViewMode } = useListingViewMode();

  return (
    <>
      <div className="mb-4 flex justify-end">
        <div className="flex rounded-xl border border-[#d3dcea] bg-white p-1">
          <button
            onClick={() => setViewMode("card")}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              viewMode === "card" ? "bg-[#0F2A4A] text-white" : "text-[#0F2A4A] hover:bg-[#edf1f7]"
            }`}
          >
            Kart
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              viewMode === "list" ? "bg-[#0F2A4A] text-white" : "text-[#0F2A4A] hover:bg-[#edf1f7]"
            }`}
          >
            Liste
          </button>
        </div>
      </div>

      <div
        className={
          viewMode === "card"
            ? "grid grid-cols-1 justify-items-center gap-2 sm:grid-cols-2 lg:grid-cols-3"
            : "space-y-2"
        }
      >
        {items.map((item) => (
          <MarketplaceCard key={item.id} item={item} basePath={basePath} viewMode={viewMode} />
        ))}
      </div>
    </>
  );
}
