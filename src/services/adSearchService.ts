import { mapDocToAd } from "@/lib/firestore/ads";
import {
  fetchServerSearch,
  searchPublishedCollectionClient,
} from "@/lib/firestore/searchCollectionClient";
import { isFirebaseClientConfigured } from "@/lib/firebase";
import { mockAds } from "@/lib/mocks/ads";
import type { Ad } from "@/types/ad";
import type { AdServerFilters } from "@/types/adBrowse";
import { adMatchesSearchQuery, passesAdServerFilters } from "@/lib/utils/adSearch";

export type SearchAdsParams = AdServerFilters & {
  query: string;
};

function buildSearchUrl(params: SearchAdsParams): string {
  const url = new URL("/api/ads/search", window.location.origin);
  url.searchParams.set("q", params.query.trim());

  if (params.city) url.searchParams.set("city", params.city);
  if (params.cities?.length) url.searchParams.set("cities", params.cities.join(","));
  if (params.category) url.searchParams.set("category", params.category);
  if (params.categories?.length) url.searchParams.set("categories", params.categories.join(","));
  if (params.brand) url.searchParams.set("brand", params.brand);
  if (params.brands?.length) url.searchParams.set("brands", params.brands.join(","));

  return url.toString();
}

function searchMockAds(params: SearchAdsParams): Ad[] {
  const trimmed = params.query.trim();
  if (!trimmed) return [];

  return mockAds
    .filter((ad) => ad.status === "published" || !ad.status)
    .filter((ad) => passesAdServerFilters(ad, params))
    .filter((ad) => adMatchesSearchQuery(ad, trimmed))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 500);
}

export async function searchAds(params: SearchAdsParams): Promise<Ad[]> {
  const trimmed = params.query.trim();
  if (!trimmed) return [];

  if (!isFirebaseClientConfigured) {
    return searchMockAds(params);
  }

  return fetchServerSearch(buildSearchUrl(params), () =>
    searchPublishedCollectionClient({
      collectionName: "ads",
      query: trimmed,
      mapDoc: mapDocToAd,
      matchesQuery: adMatchesSearchQuery,
      passesFilters: (ad) => passesAdServerFilters(ad, params),
      sortBy: (a, b) => b.createdAt - a.createdAt,
    }),
  );
}
