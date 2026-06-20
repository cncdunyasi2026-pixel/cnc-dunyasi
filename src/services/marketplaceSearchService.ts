import { mapMarketplaceDocToProfile } from "@/lib/firestore/mapMarketplaceDoc";
import {
  fetchServerSearch,
  searchPublishedCollectionClient,
} from "@/lib/firestore/searchCollectionClient";
import { isFirebaseClientConfigured } from "@/lib/firebase";
import { sparePartFirms, technicalServiceProfiles } from "@/lib/mocks/marketplace";
import type { MarketplaceProfile } from "@/types/marketplace";
import {
  marketplaceMatchesSearchQuery,
  passesMarketplaceSearchFilters,
  type MarketplaceSearchFilters,
} from "@/lib/utils/marketplaceSearch";

export type SearchMarketplaceParams = MarketplaceSearchFilters & {
  variant: "technical" | "spare";
  query: string;
};

function buildSearchUrl(params: SearchMarketplaceParams): string {
  const url = new URL("/api/marketplace/search", window.location.origin);
  url.searchParams.set("q", params.query.trim());
  url.searchParams.set("variant", params.variant);

  if (params.serviceTypes?.length) url.searchParams.set("serviceTypes", params.serviceTypes.join(","));
  if (params.expertiseBrands?.length) {
    url.searchParams.set("expertiseBrands", params.expertiseBrands.join(","));
  }
  if (params.partCategories?.length) {
    url.searchParams.set("partCategories", params.partCategories.join(","));
  }
  if (params.brandCompats?.length) url.searchParams.set("brandCompats", params.brandCompats.join(","));
  if (params.cities?.length) url.searchParams.set("cities", params.cities.join(","));

  return url.toString();
}

function collectionName(variant: SearchMarketplaceParams["variant"]) {
  return variant === "technical" ? "technical_service_listings" : "spare_part_listings";
}

function searchMockMarketplace(params: SearchMarketplaceParams): MarketplaceProfile[] {
  const pool = params.variant === "technical" ? technicalServiceProfiles : sparePartFirms;
  const trimmed = params.query.trim();
  if (!trimmed) return [];

  return pool
    .filter((item) => passesMarketplaceSearchFilters(item, params))
    .filter((item) => marketplaceMatchesSearchQuery(item, trimmed));
}

export async function searchMarketplace(params: SearchMarketplaceParams): Promise<MarketplaceProfile[]> {
  const trimmed = params.query.trim();
  if (!trimmed) return [];

  if (!isFirebaseClientConfigured) {
    return searchMockMarketplace(params);
  }

  return fetchServerSearch(buildSearchUrl(params), () =>
    searchPublishedCollectionClient({
      collectionName: collectionName(params.variant),
      query: trimmed,
      mapDoc: mapMarketplaceDocToProfile,
      matchesQuery: marketplaceMatchesSearchQuery,
      passesFilters: (item) => passesMarketplaceSearchFilters(item, params),
      sortBy: (a, b) => a.name.localeCompare(b.name, "tr"),
    }),
  );
}
