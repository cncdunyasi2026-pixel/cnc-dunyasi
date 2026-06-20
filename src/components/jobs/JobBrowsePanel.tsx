"use client";

import { useMemo, useState } from "react";
import { useListingViewMode } from "@/hooks/useListingViewMode";
import type { JobListing } from "@/types/job";
import JobCard from "@/components/jobs/JobCard";

type Props = {
  items: JobListing[];
};

export default function JobBrowsePanel({ items }: Props) {
  const { viewMode, setViewMode } = useListingViewMode();
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return items;
    }
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.company.toLowerCase().includes(term) ||
        item.location.toLowerCase().includes(term) ||
        item.workModel.toLowerCase().includes(term),
    );
  }, [items, search]);

  return (
    <>
      <div className="mb-6 rounded-2xl border border-[#d8dfeb] bg-gradient-to-b from-white to-[#f6f8fb] p-3 shadow-[0_10px_30px_rgba(15,42,74,0.08)] sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:flex-1">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pozisyon, firma veya lokasyon ara..."
              className="h-11 w-full rounded-xl border border-[#d3dcea] bg-white px-3 text-sm text-[#0F2A4A] outline-none transition focus:border-[#0F2A4A] focus:ring-2 focus:ring-[#0F2A4A]/15"
            />
            <button className="h-11 rounded-xl bg-[#0F2A4A] px-5 text-sm font-semibold text-white transition hover:bg-[#12335c]">
              Ara
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtrele — sadece mobilde göster, desktop'ta sol sidebar var */}
            <button className="h-11 rounded-xl border border-[#d3dcea] bg-white px-4 text-sm font-semibold text-[#0F2A4A] transition hover:border-[#0F2A4A]/40 hover:bg-[#f3f6fa] lg:hidden">
              Filtrele
            </button>
            <button className="h-11 rounded-xl border border-[#d3dcea] bg-white px-4 text-sm font-semibold text-[#0F2A4A] transition hover:border-[#0F2A4A]/40 hover:bg-[#f3f6fa]">
              Sirala
            </button>
            <div className="flex rounded-xl border border-[#d3dcea] bg-white p-1">
              <button
                onClick={() => setViewMode("card")}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  viewMode === "card"
                    ? "bg-[#0F2A4A] text-white shadow-[0_6px_16px_rgba(15,42,74,0.22)]"
                    : "text-[#0F2A4A] hover:bg-[#edf1f7]"
                }`}
              >
                Kart
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  viewMode === "list"
                    ? "bg-[#0F2A4A] text-white shadow-[0_6px_16px_rgba(15,42,74,0.22)]"
                    : "text-[#0F2A4A] hover:bg-[#edf1f7]"
                }`}
              >
                Liste
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <p className="rounded-[10px] bg-white p-4 text-sm text-[#7A8CA5]">Arama kriterine uygun sonuc bulunamadi.</p>
      ) : (
        <div className={viewMode === "card" ? "grid grid-cols-2 justify-items-center gap-2 lg:grid-cols-4" : "space-y-3"}>
          {filteredItems.map((item) => (
            <JobCard key={item.id} item={item} viewMode={viewMode} />
          ))}
        </div>
      )}
    </>
  );
}
