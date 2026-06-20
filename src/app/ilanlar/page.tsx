"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useListingViewMode } from "@/hooks/useListingViewMode";
import { useAdBrowse } from "@/hooks/useAdBrowse";
import { useAdSearch } from "@/hooks/useAdSearch";
import { buildAdServerFilters } from "@/types/adBrowse";
import type { Ad } from "@/types/ad";
import { formatPrice } from "@/lib/utils/format";
import { formatPowerKw, formatTableSizeMm } from "@/lib/constants/listingOptions";
import FilterSidebar from "@/components/ui/FilterSidebar";
import type { FilterGroup, RangeFilter } from "@/components/ui/FilterSidebar";
import PageHeroBanner from "@/components/page/PageHeroBanner";
import PageContentSlot from "@/components/page/PageContentSlot";
import PageContentProvider from "@/components/page/PageContentProvider";

/* ── Sabit / mock şehir verisi (tasarım amaçlı) ─────────────── */

/* ── Sıralama seçenekleri ───────────────────────────────────── */

type SortKey =
  | "date_desc"
  | "date_asc"
  | "price_desc"
  | "price_asc"
  | "year_desc"
  | "year_asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date_desc", label: "En Yeni İlan" },
  { value: "date_asc", label: "En Eski İlan" },
  { value: "price_desc", label: "Fiyat: Yüksekten Düşüğe" },
  { value: "price_asc", label: "Fiyat: Düşükten Yükseğe" },
  { value: "year_desc", label: "Üretim Yılı: Yeniden Eskiye" },
  { value: "year_asc", label: "Üretim Yılı: Eskiden Yeniye" },
];

/* ── Kart bileşeni ──────────────────────────────────────────── */

function ListingCard({ ad, viewMode }: { ad: Ad; viewMode: "card" | "list" }) {
  const images = ad.images?.length
    ? ad.images.length >= 3
      ? ad.images
      : [...ad.images, ...Array(3 - ad.images.length).fill(ad.images[0])]
    : ["/banner_1.jpg", "/banner_1.jpg", "/banner_1.jpg"];

  const yearDisplay = ad.year ?? null;
  const powerDisplay = formatPowerKw(ad.powerKw);
  const tableSizeDisplay = formatTableSizeMm(ad.tableWidthMm, ad.tableLengthMm);
  const location = [ad.city, ad.district, ad.neighborhood].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/ilan/${ad.id}`}
      className={`overflow-hidden rounded-[10px] border border-[#dbe2ea] bg-white shadow-sm transition hover:shadow-md ${
        viewMode === "list" ? "flex gap-2 p-2 sm:gap-3 sm:p-3" : "mx-auto block w-full max-w-[282px] p-2"
      }`}
    >
      <div className={viewMode === "list" ? "w-28 shrink-0 sm:w-36 md:w-48" : "space-y-2"}>
        <img
          src={images[0]}
          alt={ad.title}
          className={`w-full rounded-[8px] bg-[#f4f6f9] ${
            viewMode === "list" ? "h-20 object-cover sm:h-24 md:h-32" : "h-28 object-cover sm:h-36 md:h-44"
          }`}
        />
        {viewMode === "card" ? (
          <div className="grid grid-cols-2 gap-2">
            <img src={images[1]} alt="" className="aspect-[4/3] w-full rounded-[6px] object-cover" />
            <img src={images[2]} alt="" className="aspect-[4/3] w-full rounded-[6px] object-cover" />
          </div>
        ) : null}
      </div>

      <div className={viewMode === "list" ? "flex min-w-0 flex-1 flex-col justify-between" : "pt-2"}>
        <div>
          <h3 className="line-clamp-2 text-base font-black leading-tight text-[#0F2A4A] sm:text-base">
            {ad.title}
          </h3>
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs font-semibold text-[#1f334e] sm:text-sm">
            {yearDisplay && <span>{yearDisplay}</span>}
            {powerDisplay && <span>{powerDisplay}</span>}
            {tableSizeDisplay && <span>{tableSizeDisplay}</span>}
            {ad.axisCount && <span>{ad.axisCount}</span>}
            {!yearDisplay && !powerDisplay && !tableSizeDisplay && !ad.axisCount && ad.category && (
              <span>{ad.category}</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-[#7A8CA5] sm:gap-2 sm:text-xs">
            {location && <span className="rounded-full bg-[#edf1f6] px-2 py-1">{location}</span>}
            {ad.condition && <span className="rounded-full bg-[#edf1f6] px-2 py-1">{ad.condition}</span>}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-1.5 sm:gap-2">
          <p className="text-xs font-extrabold text-[#0F2A4A] sm:text-sm">
            {formatPrice(ad.price, ad.currency)}
          </p>
          <button className="rounded-[8px] bg-[#F26A1B] px-2 py-1 text-[10px] font-bold text-white sm:px-3 sm:py-1.5 sm:text-xs">
            İncele
          </button>
        </div>
      </div>
    </Link>
  );
}

/* ── Ana sayfa ──────────────────────────────────────────────── */

const EMPTY_GROUPS = {
  marka: [],
  durum: [],
  eksen: [],
  kategori: [],
  kimden: [],
  takas: [],
  teslimat: [],
  sehir: [],
};

export default function ListingsPage() {
  const { viewMode, setViewMode } = useListingViewMode();
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  /* ── Filtre state: pending (kullanıcı seçiyor) vs applied (listeye yansıyan) ── */
  const [pendingGroups, setPendingGroups] = useState<Record<string, string[]>>(EMPTY_GROUPS);
  const [pendingPriceRange, setPendingPriceRange] = useState<{ min: number; max: number } | null>(null);

  const [appliedGroups, setAppliedGroups] = useState<Record<string, string[]>>(EMPTY_GROUPS);
  const [appliedPriceRange, setAppliedPriceRange] = useState<{ min: number; max: number } | null>(null);

  const serverFilters = useMemo(() => buildAdServerFilters(appliedGroups), [appliedGroups]);
  const {
    ads: allAds,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    error: browseError,
  } = useAdBrowse(serverFilters);

  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    isActive: isSearchMode,
  } = useAdSearch(activeSearch, serverFilters);

  const listSource = isSearchMode ? searchResults : allAds;
  const listLoading = isSearchMode ? searchLoading : loading;
  const listError = isSearchMode ? searchError : browseError;

  const [sortKey, setSortKey] = useState<SortKey>("date_desc");
  const [sortOpen, setSortOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  /* Kaç seçim pending ama henüz uygulanmadı */
  const pendingCount = Object.values(pendingGroups).flat().length + (pendingPriceRange ? 1 : 0);
  const appliedCount = Object.values(appliedGroups).flat().length + (appliedPriceRange ? 1 : 0);

  /* ── Dinamik filtre seçenekleri ────────────────────────────── */
  const filterGroups = useMemo((): FilterGroup[] => {
    const count = (arr: (string | undefined)[], val: string) =>
      arr.filter((v) => v === val).length;

    const brands = allAds.map((a) => a.brand).filter(Boolean) as string[];
    const uniqueBrands = [...new Set(brands)].sort();

    const conditions = allAds.map((a) => a.condition).filter(Boolean) as string[];
    const uniqueConditions = [...new Set(conditions)].sort();

    const axes = allAds.map((a) => a.axisCount).filter(Boolean) as string[];
    const uniqueAxes = [...new Set(axes)].sort();

    const cats = allAds.map((a) => a.category).filter(Boolean) as string[];
    const uniqueCats = [...new Set(cats)].sort();

    const sellers  = allAds.map((a) => a.sellerType).filter(Boolean) as string[];
    const uniqueSellers = [...new Set(sellers)].sort();

    const trades   = allAds.map((a) => a.trade).filter(Boolean) as string[];
    const uniqueTrades = [...new Set(trades)].sort();

    const deliveries = allAds.map((a) => a.delivery).filter(Boolean) as string[];
    const uniqueDeliveries = [...new Set(deliveries)].sort();

    const cities = [...new Set(allAds.map((a) => a.city).filter(Boolean))].sort();

    return [
      {
        id: "marka",
        label: "Marka",
        options: uniqueBrands.map((b) => ({ label: b, count: count(brands, b) })),
      },
      {
        id: "durum",
        label: "Durum",
        options: uniqueConditions.map((c) => ({ label: c, count: count(conditions, c) })),
      },
      {
        id: "eksen",
        label: "Eksen Sayısı",
        defaultCollapsed: true,
        options: uniqueAxes.map((a) => ({ label: a, count: count(axes, a) })),
      },
      {
        id: "kategori",
        label: "Kategori",
        defaultCollapsed: true,
        options: uniqueCats.map((c) => ({ label: c, count: count(cats, c) })),
      },
      ...(uniqueSellers.length > 0 ? [{
        id: "kimden",
        label: "Kimden",
        defaultCollapsed: true,
        options: uniqueSellers.map((s) => ({ label: s, count: count(sellers, s) })),
      }] : []),
      ...(uniqueTrades.length > 0 ? [{
        id: "takas",
        label: "Takas",
        defaultCollapsed: true,
        options: uniqueTrades.map((t) => ({ label: t, count: count(trades, t) })),
      }] : []),
      ...(uniqueDeliveries.length > 0 ? [{
        id: "teslimat",
        label: "Teslimat",
        defaultCollapsed: true,
        options: uniqueDeliveries.map((d) => ({ label: d, count: count(deliveries, d) })),
      }] : []),
      ...(cities.length > 0 ? [{
        id: "sehir",
        label: "Şehir",
        defaultCollapsed: true,
        options: cities.map((c) => ({ label: c, count: count(allAds.map((a) => a.city), c) })),
      }] : []),
    ];
  }, [allAds]);

  /* ── Fiyat aralığı sınırları ───────────────────────────────── */
  const priceBounds = useMemo(() => {
    if (!allAds.length) return { min: 0, max: 10_000_000 };
    const prices = allAds.map((a) => a.price);
    return { min: 0, max: Math.ceil(Math.max(...prices) / 100_000) * 100_000 };
  }, [allAds]);

  const filterRange: RangeFilter = useMemo(() => ({
    id: "fiyat",
    label: "Fiyat Aralığı",
    min: priceBounds.min,
    max: priceBounds.max,
    unit: "TL",
  }), [priceBounds]);

  /* ── Pending filtre handlers ──────────────────────────────── */
  const handleGroupToggle = (groupId: string, label: string) => {
    setPendingGroups((prev) => {
      const cur = prev[groupId] ?? [];
      return {
        ...prev,
        [groupId]: cur.includes(label) ? cur.filter((v) => v !== label) : [...cur, label],
      };
    });
  };

  const handleRangeChange = (_id: string, min: number, max: number) => {
    setPendingPriceRange({ min, max });
  };

  const handleApply = () => {
    setAppliedGroups(pendingGroups);
    setAppliedPriceRange(pendingPriceRange);
  };

  const handleClear = () => {
    setPendingGroups(EMPTY_GROUPS);
    setPendingPriceRange(null);
    setAppliedGroups(EMPTY_GROUPS);
    setAppliedPriceRange(null);
    setSearch("");
    setActiveSearch("");
  };

  const handleSearch = () => {
    setActiveSearch(search.trim());
  };

  /* Uygulanmış filtreyi tek tek kaldır */
  const removeApplied = (groupId: string, label: string) => {
    const next = {
      ...appliedGroups,
      [groupId]: appliedGroups[groupId].filter((v) => v !== label),
    };
    setAppliedGroups(next);
    setPendingGroups(next);
  };

  /* ── Filtrelenmiş + sıralanmış liste (applied state kullanır) ─ */
  const displayed = useMemo(() => {
    let result = [...listSource];
    const { marka, durum, eksen, kategori, kimden, takas, teslimat } = appliedGroups;
    const categoryUsesIn = (kategori?.length ?? 0) > 1;
    if (marka.length && categoryUsesIn) {
      result = result.filter((a) => a.brand && marka.includes(a.brand));
    }
    if (durum.length)    result = result.filter((a) => a.condition && durum.includes(a.condition));
    if (eksen.length)    result = result.filter((a) => a.axisCount && eksen.includes(a.axisCount));
    if (kimden.length)   result = result.filter((a) => a.sellerType && kimden.includes(a.sellerType));
    if (takas.length)    result = result.filter((a) => a.trade && takas.includes(a.trade));
    if (teslimat.length) result = result.filter((a) => a.delivery && teslimat.includes(a.delivery));

    // Fiyat aralığı (sadece Filtrele'ye basınca güncellenir)
    if (appliedPriceRange) {
      result = result.filter((a) => a.price >= appliedPriceRange.min && a.price <= appliedPriceRange.max);
    }

    // Sıralama (anlık)
    result.sort((a, b) => {
      switch (sortKey) {
        case "date_asc":  return a.createdAt - b.createdAt;
        case "date_desc": return b.createdAt - a.createdAt;
        case "price_asc": return a.price - b.price;
        case "price_desc":return b.price - a.price;
        case "year_asc":  return (a.year ?? 0) - (b.year ?? 0);
        case "year_desc": return (b.year ?? 0) - (a.year ?? 0);
      }
    });

    return result;
  }, [listSource, appliedGroups, appliedPriceRange, sortKey]);

  const currentSort = SORT_OPTIONS.find((o) => o.value === sortKey)!

  return (
    <PageContentProvider pageId="ilanlar">
    <section className="mx-auto w-full max-w-7xl px-4 py-6">
      <PageContentSlot pageId="ilanlar" slotId="page_top" />
      <PageHeroBanner pageId="ilanlar" />
      <PageContentSlot pageId="ilanlar" slotId="below_header" />

      {/* Desktop: sol sidebar + içerik | Mobile: tek kolon */}
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-6">
        {/* Sol filtre sidebar */}
        <FilterSidebar
          groups={filterGroups}
          ranges={[filterRange]}
          className="hidden lg:block"
          activeGroupValues={pendingGroups}
          onGroupToggle={handleGroupToggle}
          rangeValues={pendingPriceRange ? { fiyat: pendingPriceRange } : undefined}
          onRangeChange={handleRangeChange}
          onClear={handleClear}
          footer={
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleApply}
                className="w-full rounded-xl bg-[#0F2A4A] py-2.5 text-sm font-bold text-white transition hover:bg-[#12335c]"
              >
                {pendingCount > 0 ? `Filtrele (${pendingCount})` : "Filtrele"}
              </button>
              {appliedCount > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full text-center text-xs font-semibold text-[#F26A1B] hover:underline"
                >
                  Filtreleri temizle
                </button>
              )}
            </div>
          }
        />

        {/* Arama + liste */}
        <div className="min-w-0">
          <PageContentSlot pageId="ilanlar" slotId="above_listings" />
          {/* Toolbar */}
          <div className="mb-6 rounded-2xl border border-[#d8dfeb] bg-gradient-to-b from-white to-[#f6f8fb] p-3 shadow-[0_10px_30px_rgba(15,42,74,0.08)] sm:p-4">
            {/* Satır 1: Arama */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <svg viewBox="0 0 20 20" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8CA5]">
                  <path d="M13.2 12h-.63l-.22-.21a5.2 5.2 0 1 0-.56.56l.21.22v.63L16.5 17 17 16.5 13.2 12Zm-4.8 0a4.2 4.2 0 1 1 0-8.4 4.2 4.2 0 0 1 0 8.4Z" fill="currentColor" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder="Marka, model veya ilanda ara..."
                  className="h-11 w-full rounded-xl border border-[#d3dcea] bg-white pl-10 pr-3 text-sm text-[#0F2A4A] outline-none transition focus:border-[#0F2A4A] focus:ring-2 focus:ring-[#0F2A4A]/15"
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                disabled={searchLoading}
                className="h-11 rounded-xl bg-[#0F2A4A] px-5 text-sm font-semibold text-white transition hover:bg-[#12335c] disabled:opacity-60"
              >
                {searchLoading ? "Aranıyor..." : "Ara"}
              </button>
            </div>

            {/* Satır 2: Araçlar — tek satırda */}
            <div className="mt-3 flex items-center gap-2">
              {/* Mobil filtre butonu */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="relative flex h-9 items-center gap-1.5 rounded-xl border border-[#d3dcea] bg-white px-3 text-sm font-semibold text-[#0F2A4A] transition hover:border-[#0F2A4A]/40 hover:bg-[#f3f6fa] lg:hidden"
              >
                <svg className="h-4 w-4 text-[#7A8CA5]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h3a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Filtrele
                {appliedCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#F26A1B] text-[9px] font-bold text-white">
                    {appliedCount}
                  </span>
                )}
              </button>

              {/* Sıralama dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortOpen((v) => !v)}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-[#d3dcea] bg-white px-3 text-sm font-semibold text-[#0F2A4A] transition hover:border-[#0F2A4A]/40 hover:bg-[#f3f6fa]"
                >
                  <svg className="h-4 w-4 text-[#7A8CA5]" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  </svg>
                  <span className="hidden sm:inline">{currentSort.label}</span>
                  <span className="sm:hidden">Sırala</span>
                  <svg className={`h-3.5 w-3.5 text-[#7A8CA5] transition-transform ${sortOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
                {sortOpen && (
                  <div className="absolute left-0 top-11 z-50 min-w-[220px] overflow-hidden rounded-xl border border-[#dbe2ea] bg-white shadow-lg">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setSortKey(opt.value); setSortOpen(false); }}
                        className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-[#f4f7fb] ${
                          sortKey === opt.value ? "font-bold text-[#0F2A4A]" : "text-[#38506e]"
                        }`}
                      >
                        {sortKey === opt.value ? (
                          <svg className="h-3.5 w-3.5 shrink-0 text-[#F26A1B]" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        ) : <span className="w-3.5" />}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Görünüm modu — sıralamının yanında sağda */}
              <div className="flex rounded-xl border border-[#d3dcea] bg-white p-1">
                <button
                  onClick={() => setViewMode("card")}
                  className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${
                    viewMode === "card"
                      ? "bg-[#0F2A4A] text-white shadow-[0_4px_10px_rgba(15,42,74,0.22)]"
                      : "text-[#0F2A4A] hover:bg-[#edf1f7]"
                  }`}
                >
                  Kart
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${
                    viewMode === "list"
                      ? "bg-[#0F2A4A] text-white shadow-[0_4px_10px_rgba(15,42,74,0.22)]"
                      : "text-[#0F2A4A] hover:bg-[#edf1f7]"
                  }`}
                >
                  Liste
                </button>
              </div>
            </div>

            {/* Uygulanmış filtre etiketleri */}
            {appliedCount > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#e8edf3] pt-3">
                <span className="text-xs text-[#7A8CA5]">Aktif:</span>
                {Object.entries(appliedGroups).flatMap(([groupId, labels]) =>
                  labels.map((label) => (
                    <button
                      key={`${groupId}-${label}`}
                      type="button"
                      onClick={() => removeApplied(groupId, label)}
                      className="flex items-center gap-1 rounded-full border border-[#d3dcea] bg-[#f4f7fb] px-2.5 py-0.5 text-xs font-semibold text-[#0F2A4A] hover:border-[#0F2A4A]/40"
                    >
                      {label}
                      <span className="text-[#7A8CA5]">×</span>
                    </button>
                  )),
                )}
                {appliedPriceRange && (
                  <button
                    type="button"
                    onClick={() => { setAppliedPriceRange(null); setPendingPriceRange(null); }}
                    className="flex items-center gap-1 rounded-full border border-[#d3dcea] bg-[#f4f7fb] px-2.5 py-0.5 text-xs font-semibold text-[#0F2A4A] hover:border-[#0F2A4A]/40"
                  >
                    Fiyat: {(appliedPriceRange.min / 1000).toFixed(0)}K – {(appliedPriceRange.max / 1000).toFixed(0)}K
                    <span className="text-[#7A8CA5]">×</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClear}
                  className="ml-1 text-xs font-semibold text-[#F26A1B] hover:underline"
                >
                  Tümünü temizle
                </button>
              </div>
            )}

            {/* İlan sayısı */}
            {!listLoading && (
              <p className="mt-2 text-xs text-[#7A8CA5]">
                {displayed.length} ilan gösteriliyor
                {isSearchMode
                  ? ` · «${activeSearch}» için tüm veritabanında arama`
                  : displayed.length !== allAds.length
                    ? ` (${allAds.length} yüklü kayıt içinden)`
                    : ""}
                {!isSearchMode && hasMore ? " · daha fazlası var" : ""}
              </p>
            )}
          </div>

          {/* Hata / yükleniyor */}
          {listError && (
            <p className="rounded-[10px] border border-red-200 bg-red-50 p-4 text-sm text-red-900">{listError}</p>
          )}
          {listLoading && (
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-[10px] bg-[#edf1f6]" />
              ))}
            </div>
          )}

          {!listLoading && !listError && displayed.length === 0 && (
            <div className="rounded-[10px] border border-dashed border-[#d3dcea] bg-white px-6 py-16 text-center">
              <p className="text-sm font-semibold text-[#7A8CA5]">
                {isSearchMode
                  ? "Aramanızla eşleşen ilan bulunamadı."
                  : "Filtre kriterlerine uygun ilan bulunamadı."}
              </p>
              <button
                type="button"
                onClick={handleClear}
                className="mt-3 text-xs font-semibold text-[#F26A1B] hover:underline"
              >
                Filtreleri temizle
              </button>
            </div>
          )}

          {!listLoading && displayed.length > 0 && (
            <div
              className={
                viewMode === "card"
                  ? "grid grid-cols-2 justify-items-center gap-2 lg:grid-cols-3"
                  : "space-y-3"
              }
            >
              {displayed.map((ad) => (
                <ListingCard key={ad.id} ad={ad} viewMode={viewMode} />
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
                {allAds.length} ilan yüklendi · sayfa başına 24 kayıt
              </p>
            </div>
          )}
          <PageContentSlot pageId="ilanlar" slotId="below_listings" />
        </div>
      </div>

      <PageContentSlot pageId="ilanlar" slotId="page_bottom" />

      {/* Sıralama dropdown'u kapatmak için overlay */}
      {sortOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
      )}

      {/* ── Mobil filtre drawer ──────────────────────────────── */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Karartma */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />

          {/* Çekmece — alttan kayar */}
          <div className="absolute bottom-0 left-0 right-0 flex max-h-[85dvh] flex-col rounded-t-2xl bg-white shadow-2xl">
            {/* Başlık */}
            <div className="flex items-center justify-between border-b border-[#e8edf3] px-5 py-4">
              <h2 className="text-base font-extrabold text-[#0F2A4A]">Filtreler</h2>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#7A8CA5] hover:bg-[#f4f7fb]"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Filtre içeriği — scroll */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <FilterSidebar
                groups={filterGroups}
                ranges={[filterRange]}
                className="border-0 p-0 shadow-none"
                activeGroupValues={pendingGroups}
                onGroupToggle={handleGroupToggle}
                rangeValues={pendingPriceRange ? { fiyat: pendingPriceRange } : undefined}
                onRangeChange={handleRangeChange}
                onClear={handleClear}
              />
            </div>

            {/* Alt butonlar — sabit */}
            <div className="flex gap-3 border-t border-[#e8edf3] px-5 py-4">
              {appliedCount > 0 && (
                <button
                  type="button"
                  onClick={() => { handleClear(); setMobileFilterOpen(false); }}
                  className="h-12 flex-1 rounded-xl border border-[#d3dcea] text-sm font-semibold text-[#0F2A4A] transition hover:bg-[#f4f7fb]"
                >
                  Temizle
                </button>
              )}
              <button
                type="button"
                onClick={() => { handleApply(); setMobileFilterOpen(false); }}
                className="h-12 flex-1 rounded-xl bg-[#0F2A4A] text-sm font-bold text-white transition hover:bg-[#12335c]"
              >
                {pendingCount > 0 ? `Filtrele (${pendingCount})` : "Filtrele"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
    </PageContentProvider>
  );
}
