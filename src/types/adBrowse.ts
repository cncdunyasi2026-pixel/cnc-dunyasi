import type { AdCursor } from "@/lib/firestore/ads";

/** Firestore tarafında uygulanabilen filtreler (sayfalama ile). */
export type AdServerFilters = {
  city?: string;
  cities?: string[];
  category?: string;
  categories?: string[];
  brand?: string;
  brands?: string[];
};

export type AdBrowseParams = AdServerFilters & {
  pageSize?: number;
  lastDoc?: AdCursor;
};

export function buildAdServerFilters(appliedGroups: Record<string, string[]>): AdServerFilters {
  const sehir = appliedGroups.sehir ?? [];
  const kategori = appliedGroups.kategori ?? [];
  const marka = appliedGroups.marka ?? [];

  const filters: AdServerFilters = {};

  if (sehir.length === 1) {
    filters.city = sehir[0];
  } else if (sehir.length > 1) {
    filters.cities = sehir.slice(0, 30);
  }

  if (kategori.length === 1) {
    filters.category = kategori[0];
  } else if (kategori.length > 1) {
    filters.categories = kategori.slice(0, 30);
  }

  const categoryUsesIn = (filters.categories?.length ?? 0) > 1;
  if (!categoryUsesIn) {
    if (marka.length === 1) {
      filters.brand = marka[0];
    } else if (marka.length > 1) {
      filters.brands = marka.slice(0, 30);
    }
  }

  return filters;
}

export function adServerFiltersKey(filters: AdServerFilters): string {
  return JSON.stringify(filters);
}
