"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useListingViewMode } from "@/hooks/useListingViewMode";
import FilterSidebar from "@/components/ui/FilterSidebar";
import type { FilterGroup } from "@/components/ui/FilterSidebar";
import JobCard from "@/components/jobs/JobCard";
import { useJobBrowse } from "@/hooks/useJobBrowse";
import { useJobSearch } from "@/hooks/useJobSearch";
import type { JobSearchFilters } from "@/lib/utils/jobSearch";
import PageHeroBanner from "@/components/page/PageHeroBanner";

/* ── Sıralama ────────────────────────────────────────────────── */
type SortKey = "date_desc" | "date_asc" | "salary_asc" | "salary_desc";
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date_desc",   label: "En Yeni" },
  { value: "date_asc",    label: "En Eski" },
  { value: "salary_asc",  label: "Maaş: Düşük → Yüksek" },
  { value: "salary_desc", label: "Maaş: Yüksek → Düşük" },
];

function cityFrom(loc: string) {
  return loc.split(/[,/·]/)[0].trim();
}

export default function CareerPage() {
  const { items: allItems, loading: loadingData, loadingMore, hasMore, loadMore } = useJobBrowse();
  const { viewMode, setViewMode } = useListingViewMode();
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date_desc");
  const [sortOpen, setSortOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Pending (seçildi ama uygulanmadı)
  const [pendingGroups, setPendingGroups] = useState<Record<string, string[]>>({});
  // Uygulandı
  const [appliedGroups, setAppliedGroups] = useState<Record<string, string[]>>({});

  const searchFilters = useMemo((): JobSearchFilters => ({
    workModels: appliedGroups.model?.length ? appliedGroups.model : undefined,
    positions: appliedGroups.pozisyon?.length ? appliedGroups.pozisyon : undefined,
    experienceLevels: appliedGroups.deneyim?.length ? appliedGroups.deneyim : undefined,
    cities: appliedGroups.sehir?.length ? appliedGroups.sehir : undefined,
  }), [appliedGroups]);

  const {
    results: searchResults,
    loading: searchLoading,
    isActive: isSearchMode,
  } = useJobSearch(activeSearch, searchFilters);

  const listSource = isSearchMode ? searchResults : allItems;
  const listLoading = isSearchMode ? searchLoading : loadingData;

  /* ── Filtre grupları: gerçek veriden dinamik ────────────────── */
  const filterGroups = useMemo<FilterGroup[]>(() => {
    const positions  = [...new Set(allItems.map((j) => j.position ?? j.level).filter(Boolean))];
    const workModels = [...new Set(allItems.map((j) => j.workModel).filter(Boolean))];

    const groups: FilterGroup[] = [];

    if (workModels.length > 0) {
      groups.push({
        id: "model",
        label: "Çalışma Modeli",
        options: workModels.map((m) => ({
          label: m,
          count: allItems.filter((j) => j.workModel === m).length || undefined,
        })),
      });
    }

    if (positions.length > 0) {
      groups.push({
        id: "pozisyon",
        label: "Pozisyon",
        options: positions.map((p) => ({
          label: p,
          count: allItems.filter((j) => (j.position ?? j.level) === p).length || undefined,
        })),
      });
    }

    const expLevels = [...new Set(allItems.map((j) => j.experienceLevel).filter(Boolean))] as string[];
    const allExpLevels = ["0-2 Yıl", "2-5 Yıl", "5-10 Yıl", "10+ Yıl"];
    const expOptions = expLevels.length > 0 ? expLevels : allExpLevels;
    groups.push({
      id: "deneyim",
      label: "Deneyim",
      defaultCollapsed: true,
      options: expOptions.map((e) => ({
        label: e,
        count: allItems.filter((j) => j.experienceLevel === e).length || undefined,
      })),
    });

    const cities = [...new Set(allItems.map((j) => cityFrom(j.location)).filter(Boolean))].sort();
    if (cities.length > 0) {
      groups.push({
        id: "sehir",
        label: "Şehir",
        defaultCollapsed: true,
        options: cities.map((c) => ({
          label: c,
          count: allItems.filter((j) => cityFrom(j.location) === c).length || undefined,
        })),
      });
    }

    return groups;
  }, [allItems]);

  /* ── Pending toggle ──────────────────────────────────────────── */
  const handleGroupToggle = (groupId: string, label: string) => {
    setPendingGroups((prev) => {
      const cur = prev[groupId] ?? [];
      return {
        ...prev,
        [groupId]: cur.includes(label) ? cur.filter((v) => v !== label) : [...cur, label],
      };
    });
  };

  const handleApply = () => {
    setAppliedGroups({ ...pendingGroups });
    setMobileFilterOpen(false);
  };

  const handleClear = () => {
    setPendingGroups({});
    setAppliedGroups({});
    setSearch("");
    setActiveSearch("");
  };

  const handleSearch = () => {
    setActiveSearch(search.trim());
  };

  /* ── Filtrele + sırala ──────────────────────────────────────── */
  const displayed = useMemo(() => {
    let result = listSource;

    if (!isSearchMode) {
      const modelFilter = appliedGroups["model"] ?? [];
      if (modelFilter.length > 0) {
        result = result.filter((j) => modelFilter.includes(j.workModel));
      }

      const pozisyonFilter = appliedGroups["pozisyon"] ?? [];
      if (pozisyonFilter.length > 0) {
        result = result.filter((j) => pozisyonFilter.includes(j.position ?? j.level));
      }

      const deneyimFilter = appliedGroups["deneyim"] ?? [];
      if (deneyimFilter.length > 0) {
        result = result.filter((j) => j.experienceLevel && deneyimFilter.includes(j.experienceLevel));
      }

      const sehirFilter = appliedGroups["sehir"] ?? [];
      if (sehirFilter.length > 0) {
        result = result.filter((j) => sehirFilter.includes(cityFrom(j.location)));
      }
    }

    // Sıralama
    result = [...result].sort((a, b) => {
      if (sortKey === "date_asc") return a.postedAt.localeCompare(b.postedAt);
      if (sortKey === "salary_asc") return a.salary.localeCompare(b.salary);
      if (sortKey === "salary_desc") return b.salary.localeCompare(a.salary);
      return b.postedAt.localeCompare(a.postedAt); // date_desc
    });

    return result;
  }, [listSource, appliedGroups, sortKey, isSearchMode]);

  const appliedCount = Object.values(appliedGroups).reduce((s, v) => s + v.length, 0);
  const currentSort = SORT_OPTIONS.find((o) => o.value === sortKey)!;

  const filterFooter = (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleApply}
        className="flex-1 rounded-xl bg-[#0F2A4A] py-2.5 text-sm font-bold text-white transition hover:bg-[#1A4A7A]"
      >
        Filtrele {appliedCount > 0 ? `(${appliedCount})` : ""}
      </button>
      {appliedCount > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="rounded-xl border border-[#d3dcea] px-3 py-2.5 text-sm font-semibold text-[#61748f] transition hover:bg-[#f5f7fa]"
        >
          Temizle
        </button>
      )}
    </div>
  );

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6">
      <PageHeroBanner pageId="kariyer" />

      {/* İçerik: sol sidebar + sağ liste */}
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-6">
        {/* Desktop filtre sidebar */}
        <FilterSidebar
          groups={filterGroups}
          className="hidden lg:block"
          activeGroupValues={pendingGroups}
          onGroupToggle={handleGroupToggle}
          footer={filterFooter}
        />

        {/* Sağ kolon */}
        <div className="min-w-0 space-y-4">
          {/* Araç çubuğu */}
          <div className="rounded-2xl border border-[#d3dcea] bg-white p-3 shadow-sm">
            {/* Arama */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8CA5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  className="h-10 w-full rounded-xl border border-[#d3dcea] bg-[#f7f9fc] pl-9 pr-3 text-sm text-[#0F2A4A] outline-none focus:border-[#0F2A4A] focus:ring-2 focus:ring-[#0F2A4A]/10"
                  placeholder="Pozisyon, firma, lokasyon ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                disabled={searchLoading}
                className="h-10 rounded-xl bg-[#0F2A4A] px-5 text-sm font-semibold text-white transition hover:bg-[#12335c] disabled:opacity-60"
              >
                {searchLoading ? "..." : "Ara"}
              </button>
            </div>
            {isSearchMode && activeSearch && (
              <p className="mt-2 text-xs text-[#7A8CA5]">
                «{activeSearch}» için tüm veritabanında arama
              </p>
            )}

            {/* Araçlar */}
            <div className="mt-3 flex items-center gap-2">
              {/* Mobil filtre butonu */}
              <button
                type="button"
                className="relative flex h-9 items-center gap-1.5 rounded-xl border border-[#d3dcea] bg-white px-3 text-sm font-semibold text-[#0F2A4A] transition hover:bg-[#f5f7fa] lg:hidden"
                onClick={() => setMobileFilterOpen(true)}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M10 20h4" />
                </svg>
                Filtrele
                {appliedCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#F26A1B] text-[10px] font-bold text-white">
                    {appliedCount}
                  </span>
                )}
              </button>

              {/* Sıralama */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortOpen((o) => !o)}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-[#d3dcea] bg-white px-3 text-sm font-semibold text-[#0F2A4A] transition hover:bg-[#f5f7fa]"
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h6M3 12h10M3 17h14" />
                  </svg>
                  <span className="hidden sm:inline">{currentSort.label}</span>
                  <span className="sm:hidden">Sırala</span>
                </button>
                {sortOpen && (
                  <div className="absolute left-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-[#d3dcea] bg-white shadow-lg">
                    {SORT_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => { setSortKey(o.value); setSortOpen(false); }}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition ${sortKey === o.value ? "bg-[#f0f5ff] font-semibold text-[#0F2A4A]" : "text-[#334155] hover:bg-[#f7f9fc]"}`}
                      >
                        {o.label}
                        {sortKey === o.value && <svg className="h-4 w-4 text-[#0F2A4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1" />
              <span className="text-xs text-[#7A8CA5]">{displayed.length} ilan</span>

              {/* Kart | Liste */}
              <div className="flex rounded-xl border border-[#d3dcea] bg-white p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("card")}
                  className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${viewMode === "card" ? "bg-[#0F2A4A] text-white shadow-[0_4px_10px_rgba(15,42,74,0.22)]" : "text-[#0F2A4A] hover:bg-[#edf1f7]"}`}
                >
                  Kart
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${viewMode === "list" ? "bg-[#0F2A4A] text-white shadow-[0_4px_10px_rgba(15,42,74,0.22)]" : "text-[#0F2A4A] hover:bg-[#edf1f7]"}`}
                >
                  Liste
                </button>
              </div>
            </div>
          </div>

          {/* Sonuçlar */}
          {listLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#f0f4f8]" />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d3dcea] py-16 text-center">
              <p className="text-sm font-semibold text-[#7A8CA5]">Sonuç bulunamadı.</p>
            </div>
          ) : (
            <div className={viewMode === "card" ? "grid grid-cols-2 justify-items-center gap-2 lg:grid-cols-3" : "space-y-3"}>
              {displayed.map((job) => (
                <JobCard key={job.id} item={job} viewMode={viewMode} />
              ))}
            </div>
          )}

          {!listLoading && !isSearchMode && hasMore && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="rounded-xl border border-[#0F2A4A] bg-white px-6 py-3 text-sm font-bold text-[#0F2A4A] transition hover:bg-[#0F2A4A] hover:text-white disabled:opacity-60"
              >
                {loadingMore ? "Yükleniyor..." : "Daha fazla ilan göster"}
              </button>
              <p className="text-xs text-[#7A8CA5]">
                {allItems.length} ilan yüklendi · sayfa başına 24 kayıt
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobil filtre drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilterOpen(false)} />
          <div className="relative flex max-h-[85vh] flex-col overflow-hidden rounded-t-3xl bg-white">
            <div className="flex items-center justify-between border-b border-[#e8edf3] px-5 py-4">
              <p className="font-bold text-[#0F2A4A]">Filtreler</p>
              <button type="button" onClick={() => setMobileFilterOpen(false)} className="rounded-lg p-1 text-[#7A8CA5] hover:bg-[#f5f7fa]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <FilterSidebar
                groups={filterGroups}
                activeGroupValues={pendingGroups}
                onGroupToggle={handleGroupToggle}
              />
            </div>
            <div className="border-t border-[#e8edf3] px-5 py-4">
              {filterFooter}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
