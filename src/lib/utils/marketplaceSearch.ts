import type { MarketplaceProfile } from "@/types/marketplace";
import {
  buildSearchTokensFromBlob,
  matchesTokenizedQuery,
  pickPrimarySearchToken,
  tokenizeSearchQuery,
} from "@/lib/utils/searchTokens";

export { pickPrimarySearchToken, tokenizeSearchQuery };

export function getMarketplaceSearchableFields(item: Partial<MarketplaceProfile>): string[] {
  return [
    item.name,
    item.title,
    item.city,
    item.district,
    item.neighborhood,
    item.expertise,
    item.description,
    item.category,
    item.serviceType,
    item.expertiseBrand,
    item.partCategory,
    item.brandCompat,
  ].filter((value): value is string => Boolean(value && String(value).trim()));
}

export function marketplaceSearchBlob(item: Partial<MarketplaceProfile>): string {
  return getMarketplaceSearchableFields(item).join(" ");
}

export function marketplaceMatchesSearchQuery(
  item: Partial<MarketplaceProfile>,
  query: string,
): boolean {
  return matchesTokenizedQuery(marketplaceSearchBlob(item), query);
}

export function buildMarketplaceSearchTokens(item: Partial<MarketplaceProfile> | Record<string, unknown>): string[] {
  return buildSearchTokensFromBlob(marketplaceSearchBlob(item as Partial<MarketplaceProfile>));
}

export type MarketplaceSearchFilters = {
  serviceTypes?: string[];
  expertiseBrands?: string[];
  partCategories?: string[];
  brandCompats?: string[];
  cities?: string[];
};

export function passesMarketplaceSearchFilters(
  item: MarketplaceProfile,
  filters: MarketplaceSearchFilters,
): boolean {
  if (filters.serviceTypes?.length && !filters.serviceTypes.includes(item.serviceType ?? "")) {
    return false;
  }
  if (filters.expertiseBrands?.length && !filters.expertiseBrands.includes(item.expertiseBrand ?? "")) {
    return false;
  }
  if (filters.partCategories?.length && !filters.partCategories.includes(item.partCategory ?? "")) {
    return false;
  }
  if (filters.brandCompats?.length && !filters.brandCompats.includes(item.brandCompat ?? "")) {
    return false;
  }
  if (filters.cities?.length && !filters.cities.includes(item.city)) {
    return false;
  }
  return true;
}
