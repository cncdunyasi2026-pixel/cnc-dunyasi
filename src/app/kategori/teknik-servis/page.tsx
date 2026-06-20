"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FilterSidebar from "@/components/ui/FilterSidebar";
import type { FilterGroup } from "@/components/ui/FilterSidebar";
import MarketplaceBrowsePanel from "@/components/marketplace/MarketplaceBrowsePanel";
import { useMarketplaceBrowse } from "@/hooks/useMarketplaceBrowse";
import { useMarketplaceSearch } from "@/hooks/useMarketplaceSearch";
import type { MarketplaceProfile } from "@/types/marketplace";
import type { MarketplaceSearchFilters } from "@/lib/utils/marketplaceSearch";
import { serviceTypeService } from "@/services/siteDataService";
import { getBrands } from "@/services/brandModelService";
import PageHeroBanner from "@/components/page/PageHeroBanner";
import PageContentSlot from "@/components/page/PageContentSlot";
import PageContentProvider from "@/components/page/PageContentProvider";


type SortKey = "date_desc" | "date_asc" | "name_asc";
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date_desc", label: "En Yeni" },
  { value: "date_asc",  label: "En Eski" },
  { value: "name_asc",  label: "İsim (A → Z)" },
];

export default function TechnicalServicePage() {
  const { items: allItems, loading: loadingData, loadingMore, hasMore, loadMore } = useMarketplaceBrowse("technical");
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date_desc");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [pendingGroups, setPendingGroups] = useState<Record<string, string[]>>({});
  const [appliedGroups, setAppliedGroups] = useState<Record<string, string[]>>({});

  const searchFilters = useMemo((): MarketplaceSearchFilters => ({
    serviceTypes: appliedGroups.hizmet?.length ? appliedGroups.hizmet : undefined,
    expertiseBrands: appliedGroups.marka?.length ? appliedGroups.marka : undefined,
    cities: appliedGroups.sehir?.length ? appliedGroups.sehir : undefined,
  }), [appliedGroups]);

  const {
    results: searchResults,
    loading: searchLoading,
    isActive: isSearchMode,
  } = useMarketplaceSearch("technical", activeSearch, searchFilters);

  const listSource = isSearchMode ? searchResults : allItems;
  const listLoading = isSearchMode ? searchLoading : loadingData;

  const [adminServiceTypes, setAdminServiceTypes] = useState<string[]>([]);
  const [adminCncBrands, setAdminCncBrands] = useState<string[]>([]);

  useEffect(() => {
    void serviceTypeService.getAll().then((list) => setAdminServiceTypes(list.map((i) => i.name)));
    void getBrands().then((list) => setAdminCncBrands(list.map((b) => b.name)));
  }, []);

  /* Dinamik filtre grupları */
  const filterGroups = useMemo<FilterGroup[]>(() => {
    const fromListings = [...new Set(allItems.map((i) => i.serviceType).filter(Boolean))] as string[];
    const serviceTypes = adminServiceTypes.length > 0 ? adminServiceTypes : fromListings;

    const brandsFromListings = [...new Set(allItems.map((i) => i.expertiseBrand).filter(Boolean))] as string[];
    const expertiseBrands = adminCncBrands.length > 0 ? adminCncBrands : brandsFromListings;

    const groups: FilterGroup[] = [];
    if (serviceTypes.length > 0) {
      groups.push({
        id: "hizmet",
        label: "Hizmet Tipi",
        options: serviceTypes.map((s) => ({
          label: s,
          count: allItems.filter((i) => i.serviceType === s).length || undefined,
        })),
      });
    }
    if (expertiseBrands.length > 0) {
      groups.push({
        id: "marka",
        label: "Uzman Markası",
        options: expertiseBrands.map((b) => ({
          label: b,
          count: allItems.filter((i) => i.expertiseBrand === b).length || undefined,
        })),
      });
    }
    const cities = [...new Set(allItems.map((i) => i.city).filter(Boolean))].sort();
    if (cities.length > 0) {
      groups.push({
        id: "sehir",
        label: "Şehir",
        defaultCollapsed: true,
        options: cities.map((c) => ({
          label: c,
          count: allItems.filter((i) => i.city === c).length || undefined,
        })),
      });
    }

    return groups;
  }, [allItems, adminServiceTypes]);

  const handleGroupToggle = (groupId: string, label: string) => {
    setPendingGroups((prev) => {
      const cur = prev[groupId] ?? [];
      return { ...prev, [groupId]: cur.includes(label) ? cur.filter((v) => v !== label) : [...cur, label] };
    });
  };
  const handleApply = () => { setAppliedGroups({ ...pendingGroups }); setMobileFilterOpen(false); };
  const handleClear = () => {
    setPendingGroups({});
    setAppliedGroups({});
    setSearch("");
    setActiveSearch("");
  };

  const filteredItems = useMemo(() => {
    let result = listSource;

    if (!isSearchMode) {
      const hizmet = appliedGroups["hizmet"] ?? [];
      if (hizmet.length > 0) result = result.filter((i) => hizmet.includes(i.serviceType ?? ""));

      const marka = appliedGroups["marka"] ?? [];
      if (marka.length > 0) result = result.filter((i) => marka.includes(i.expertiseBrand ?? ""));

      const sehir = appliedGroups["sehir"] ?? [];
      if (sehir.length > 0) result = result.filter((i) => sehir.includes(i.city));
    }

    if (sortKey === "name_asc") result = [...result].sort((a, b) => a.name.localeCompare(b.name, "tr"));
    return result;
  }, [listSource, appliedGroups, sortKey, isSearchMode]);

  const appliedCount = Object.values(appliedGroups).reduce((s, v) => s + v.length, 0);

  const filterFooter = (
    <div className="flex gap-2">
      <button type="button" onClick={handleApply}
        className="flex-1 rounded-xl bg-[#0F2A4A] py-2.5 text-sm font-bold text-white transition hover:bg-[#1A4A7A]">
        Filtrele {appliedCount > 0 ? `(${appliedCount})` : ""}
      </button>
      {appliedCount > 0 && (
        <button type="button" onClick={handleClear}
          className="rounded-xl border border-[#d3dcea] px-3 py-2.5 text-sm font-semibold text-[#61748f] transition hover:bg-[#f5f7fa]">
          Temizle
        </button>
      )}
    </div>
  );

  return (
    <PageContentProvider pageId="teknik-servis">
    <section className="mx-auto w-full max-w-7xl px-4 py-6">
      <PageContentSlot pageId="teknik-servis" slotId="page_top" />
      <PageHeroBanner pageId="teknik-servis" />
      <PageContentSlot pageId="teknik-servis" slotId="below_header" />

      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-6">
        <FilterSidebar groups={filterGroups} className="hidden lg:block"
          activeGroupValues={pendingGroups} onGroupToggle={handleGroupToggle} footer={filterFooter} />

        <div className="min-w-0">
          <PageContentSlot pageId="teknik-servis" slotId="above_listings" />
          {listLoading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#f0f4f8]" />)}</div>
          ) : (
            <MarketplaceBrowsePanel
              items={filteredItems}
              basePath="/kategori/teknik-servis"
              searchPlaceholder="Marka, model, arıza veya bölgede servis ara..."
              singleImage
              sortOptions={SORT_OPTIONS}
              sortKey={sortKey}
              onSortChange={(k) => setSortKey(k as SortKey)}
              onFilterClick={() => setMobileFilterOpen(true)}
              filterBadgeCount={appliedCount}
              totalCount={filteredItems.length}
              appliedGroups={appliedGroups}
              search={search}
              onSearchChange={setSearch}
              onSearchSubmit={() => setActiveSearch(search.trim())}
              searchLoading={searchLoading}
              isSearchMode={isSearchMode}
              activeSearch={activeSearch}
              onRemoveApplied={(groupId, label) => {
                const next = { ...appliedGroups, [groupId]: (appliedGroups[groupId] ?? []).filter((v) => v !== label) };
                setAppliedGroups(next);
                setPendingGroups(next);
              }}
              onClearAll={handleClear}
            />
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
          <PageContentSlot pageId="teknik-servis" slotId="below_listings" />
        </div>
      </div>

      <PageContentSlot pageId="teknik-servis" slotId="page_bottom" />

      {/* Bilgi kutusu */}
      <div className="mt-8 mb-4 rounded-2xl border border-[#dbe2ea] bg-gradient-to-b from-white to-[#f5f8fc] p-4 shadow-sm sm:p-5">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#7A8CA5]">UZMAN AĞI</p>
        <h1 className="mt-1 text-2xl font-extrabold text-[#0F2A4A] sm:text-3xl">TEKNİK SERVİS İLANLARI</h1>
        <p className="mt-2 text-sm text-[#5f6f86]">
          Uzman ekipler kendi servis profillerini oluşturur. Karttan detaylara gidip uzmanlık, bölge ve iletişim bilgilerini inceleyebilirsiniz.
        </p>
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
              <FilterSidebar groups={filterGroups} activeGroupValues={pendingGroups} onGroupToggle={handleGroupToggle} />
            </div>
            <div className="border-t border-[#e8edf3] px-5 py-4">{filterFooter}</div>
          </div>
        </div>
      )}
    </section>
    </PageContentProvider>
  );
}
