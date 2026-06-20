import type { Ad } from "@/types/ad";
import type { AdServerFilters } from "@/types/adBrowse";
import { normalizeForSearch } from "@/lib/utils/searchText";
import {
  buildSearchTokensFromBlob,
  matchesTokenizedQuery,
  pickPrimarySearchToken,
  tokenizeSearchQuery,
} from "@/lib/utils/searchTokens";

export { pickPrimarySearchToken, tokenizeSearchQuery };

export function getAdSearchableFields(ad: Partial<Ad>): string[] {
  return [
    ad.title,
    ad.brand,
    ad.model,
    ad.city,
    ad.district,
    ad.neighborhood,
    ad.description,
    ad.category,
    ad.condition,
    ad.axisCount,
    ad.year != null ? String(ad.year) : undefined,
    ad.powerKw != null ? String(ad.powerKw) : undefined,
    ad.tableWidthMm != null && ad.tableLengthMm != null
      ? `${ad.tableWidthMm}x${ad.tableLengthMm}`
      : undefined,
  ].filter((value): value is string => Boolean(value && String(value).trim()));
}

export function adSearchBlob(ad: Partial<Ad>): string {
  return getAdSearchableFields(ad).join(" ");
}

export function adMatchesSearchQuery(ad: Partial<Ad>, query: string): boolean {
  return matchesTokenizedQuery(adSearchBlob(ad), query);
}

export function buildAdSearchTokens(ad: Partial<Ad>): string[] {
  return buildSearchTokensFromBlob(adSearchBlob(ad));
}

export function passesAdServerFilters(ad: Ad, filters: AdServerFilters): boolean {
  if (filters.city && ad.city !== filters.city) return false;
  if (filters.cities?.length && !filters.cities.includes(ad.city)) return false;
  if (filters.category && ad.category !== filters.category) return false;
  if (filters.categories?.length && !filters.categories.includes(ad.category)) return false;
  if (filters.brand && ad.brand !== filters.brand) return false;
  if (filters.brands?.length && (!ad.brand || !filters.brands.includes(ad.brand))) return false;
  return true;
}
