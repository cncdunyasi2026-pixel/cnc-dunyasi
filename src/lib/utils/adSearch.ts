import type { Ad } from "@/types/ad";
import type { AdServerFilters } from "@/types/adBrowse";
import { normalizeForSearch } from "@/lib/utils/searchText";

const MIN_PREFIX_LEN = 3;
const MAX_TOKENS_PER_AD = 400;

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
  ].filter((value): value is string => Boolean(value && String(value).trim()));
}

export function adSearchBlob(ad: Partial<Ad>): string {
  return getAdSearchableFields(ad).join(" ");
}

/** Kullanıcı aramasını kelime parçalarına ayırır (AND mantığı). */
export function tokenizeSearchQuery(query: string): string[] {
  const normalized = normalizeForSearch(query);
  if (!normalized) return [];
  return [...new Set(normalized.split(/[^a-z0-9]+/).filter((part) => part.length >= 2))];
}

export function adMatchesSearchQuery(ad: Partial<Ad>, query: string): boolean {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) return true;

  const blob = normalizeForSearch(adSearchBlob(ad));
  return tokens.every((token) => blob.includes(token));
}

/** Firestore array-contains sorguları için ön ek + tam kelime tokenları. */
export function buildAdSearchTokens(ad: Partial<Ad>): string[] {
  const words = normalizeForSearch(adSearchBlob(ad))
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 2);

  const tokens = new Set<string>();
  for (const word of words) {
    tokens.add(word);
    for (let len = MIN_PREFIX_LEN; len < word.length; len += 1) {
      tokens.add(word.slice(0, len));
    }
  }

  return [...tokens].slice(0, MAX_TOKENS_PER_AD);
}

export function pickPrimarySearchToken(query: string): string | null {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) return null;
  return tokens.sort((a, b) => b.length - a.length)[0] ?? null;
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
