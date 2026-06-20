"use client";

import { useMemo, useState } from "react";
import { useListingViewMode } from "@/hooks/useListingViewMode";
import type { MarketplaceProfile } from "@/types/marketplace";
import MarketplaceCard from "@/components/marketplace/MarketplaceCard";
import { matchesAnySearch } from "@/lib/utils/searchText";

type SortOption = { value: string; label: string };

type Props = {
  items: MarketplaceProfile[];
  basePath: string;
  searchPlaceholder: string;
  singleImage?: boolean;
  sortOptions?: SortOption[];
  sortKey?: string;
  onSortChange?: (key: string) => void;
  onFilterClick?: () => void;
  filterBadgeCount?: number;
  totalCount?: number;
  appliedGroups?: Record<string, string[]>;
  onRemoveApplied?: (groupId: string, label: string) => void;
  onClearAll?: () => void;
  /** Kontrollü arama — Ara butonu ile sunucu araması */
  search?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  searchLoading?: boolean;
  isSearchMode?: boolean;
  activeSearch?: string;
};

export default function MarketplaceBrowsePanel({
  items,
  basePath,
  searchPlaceholder,
  singleImage = false,
  sortOptions,
  sortKey,
  onSortChange,
  onFilterClick,
  filterBadgeCount = 0,
  totalCount,
  appliedGroups,
  onRemoveApplied,
  onClearAll,
  search: controlledSearch,
  onSearchChange,
  onSearchSubmit,
  searchLoading = false,
  isSearchMode = false,
  activeSearch = "",
}: Props) {
  const { viewMode, setViewMode } = useListingViewMode();
  const [internalSearch, setInternalSearch] = useState("");
  const [sortOpen, setSortOpen] = useState(false);

  const serverSearch = Boolean(onSearchSubmit);
  const search = controlledSearch ?? internalSearch;
  const setSearch = onSearchChange ?? setInternalSearch;

  const currentSort = sortOptions?.find((o) => o.value === sortKey);
  const appliedCount = appliedGroups
    ? Object.values(appliedGroups).reduce((s, v) => s + v.length, 0)
    : 0;

  const filteredItems = useMemo(() => {
    if (serverSearch || !search.trim()) return items;
    return items.filter((item) =>
      matchesAnySearch(
        [item.name, item.title, item.city, item.expertise, item.expertiseBrand, item.serviceType],
        search,
      ),
    );
  }, [items, search, serverSearch]);

  const displayCount = totalCount ?? filteredItems.length;

  return (
    <>
      {/* ── Toolbar — ilanlar sayfasıyla aynı tasarım ─────────── */}
      <div className="mb-6 rounded-2xl border border-[#d8dfeb] bg-gradient-to-b from-white to-[#f6f8fb] p-3 shadow-[0_10px_30px_rgba(15,42,74,0.08)] sm:p-4">
        {/* Satır 1: Arama */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8CA5]"
            >
              <path
                d="M13.2 12h-.63l-.22-.21a5.2 5.2 0 1 0-.56.56l.21.22v.63L16.5 17 17 16.5 13.2 12Zm-4.8 0a4.2 4.2 0 1 1 0-8.4 4.2 4.2 0 0 1 0 8.4Z"
                fill="currentColor"
              />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && onSearchSubmit) {
                  e.preventDefault();
                  onSearchSubmit();
                }
              }}
              placeholder={searchPlaceholder}
              className="h-11 w-full rounded-xl border border-[#d3dcea] bg-white pl-10 pr-3 text-sm text-[#0F2A4A] outline-none transition focus:border-[#0F2A4A] focus:ring-2 focus:ring-[#0F2A4A]/15"
            />
          </div>
          <button
            type="button"
            onClick={onSearchSubmit ?? undefined}
            disabled={searchLoading}
            className="h-11 rounded-xl bg-[#0F2A4A] px-5 text-sm font-semibold text-white transition hover:bg-[#12335c] disabled:opacity-60"
          >
            {searchLoading ? "Aranıyor..." : "Ara"}
          </button>
        </div>

        {/* Satır 2: Araçlar */}
        <div className="mt-3 flex items-center gap-2">
          {/* Mobil Filtrele */}
          {onFilterClick && (
            <button
              type="button"
              onClick={onFilterClick}
              className="relative flex h-9 items-center gap-1.5 rounded-xl border border-[#d3dcea] bg-white px-3 text-sm font-semibold text-[#0F2A4A] transition hover:border-[#0F2A4A]/40 hover:bg-[#f3f6fa] lg:hidden"
            >
              <svg className="h-4 w-4 text-[#7A8CA5]" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h3a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Filtrele
              {filterBadgeCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#F26A1B] text-[9px] font-bold text-white">
                  {filterBadgeCount}
                </span>
              )}
            </button>
          )}

          {/* Sıralama */}
          {sortOptions && sortOptions.length > 0 && onSortChange && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortOpen((v) => !v)}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-[#d3dcea] bg-white px-3 text-sm font-semibold text-[#0F2A4A] transition hover:border-[#0F2A4A]/40 hover:bg-[#f3f6fa]"
              >
                <svg className="h-4 w-4 text-[#7A8CA5]" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
                <span className="hidden sm:inline">{currentSort?.label ?? "Sırala"}</span>
                <span className="sm:hidden">Sırala</span>
                <svg
                  className={`h-3.5 w-3.5 text-[#7A8CA5] transition-transform ${sortOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {sortOpen && (
                <div className="absolute left-0 top-11 z-50 min-w-[220px] overflow-hidden rounded-xl border border-[#dbe2ea] bg-white shadow-lg">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { onSortChange(opt.value); setSortOpen(false); }}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-[#f4f7fb] ${
                        sortKey === opt.value ? "font-bold text-[#0F2A4A]" : "text-[#38506e]"
                      }`}
                    >
                      {sortKey === opt.value ? (
                        <svg className="h-3.5 w-3.5 shrink-0 text-[#F26A1B]" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span className="w-3.5" />
                      )}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Kart | Liste */}
          <div className="flex rounded-xl border border-[#d3dcea] bg-white p-1">
            <button
              type="button"
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
              type="button"
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
        {appliedCount > 0 && appliedGroups && onRemoveApplied && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#e8edf3] pt-3">
            <span className="text-xs text-[#7A8CA5]">Aktif:</span>
            {Object.entries(appliedGroups).flatMap(([groupId, labels]) =>
              labels.map((label) => (
                <button
                  key={`${groupId}-${label}`}
                  type="button"
                  onClick={() => onRemoveApplied(groupId, label)}
                  className="flex items-center gap-1 rounded-full border border-[#d3dcea] bg-[#f4f7fb] px-2.5 py-0.5 text-xs font-semibold text-[#0F2A4A] hover:border-[#0F2A4A]/40"
                >
                  {label}
                  <span className="text-[#7A8CA5]">×</span>
                </button>
              )),
            )}
            {onClearAll && (
              <button
                type="button"
                onClick={onClearAll}
                className="ml-1 text-xs font-semibold text-[#F26A1B] hover:underline"
              >
                Tümünü temizle
              </button>
            )}
          </div>
        )}

        {/* İlan sayısı */}
        <p className="mt-2 text-xs text-[#7A8CA5]">
          {displayCount} ilan
          {isSearchMode && activeSearch ? ` · «${activeSearch}» için tüm veritabanında arama` : ""}
        </p>
      </div>

      {/* Dropdown overlay */}
      {sortOpen && <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />}

      {/* Kartlar */}
      {filteredItems.length === 0 ? (
        <p className="rounded-[10px] bg-white p-4 text-sm text-[#7A8CA5]">
          Arama kriterine uygun sonuç bulunamadı.
        </p>
      ) : (
        <div
          className={
            viewMode === "card"
              ? "grid grid-cols-2 justify-items-center gap-2 lg:grid-cols-4"
              : "space-y-3"
          }
        >
          {filteredItems.map((item) => (
            <MarketplaceCard
              key={item.id}
              item={item}
              basePath={basePath}
              viewMode={viewMode}
              singleImage={singleImage}
            />
          ))}
        </div>
      )}
    </>
  );
}
