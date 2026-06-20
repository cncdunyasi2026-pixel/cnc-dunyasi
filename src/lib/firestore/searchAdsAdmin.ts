import "server-only";

import { mapAdSnapshotToAd } from "@/lib/firestore/mapAdDoc";
import { searchPublishedCollection } from "@/lib/firestore/searchCollectionAdmin";
import type { Ad } from "@/types/ad";
import type { AdServerFilters } from "@/types/adBrowse";
import { adMatchesSearchQuery, passesAdServerFilters } from "@/lib/utils/adSearch";

export async function searchPublishedAdsAdmin(
  query: string,
  filters: AdServerFilters = {},
): Promise<Ad[]> {
  return searchPublishedCollection({
    collectionName: "ads",
    query,
    mapDoc: mapAdSnapshotToAd,
    matchesQuery: adMatchesSearchQuery,
    passesFilters: (ad) => passesAdServerFilters(ad, filters),
    sortBy: (a, b) => b.createdAt - a.createdAt,
  });
}
