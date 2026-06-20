import "server-only";

import { mapMarketplaceDocToProfile } from "@/lib/firestore/mapMarketplaceDoc";
import { searchPublishedCollection } from "@/lib/firestore/searchCollectionAdmin";
import type { MarketplaceProfile } from "@/types/marketplace";
import {
  marketplaceMatchesSearchQuery,
  passesMarketplaceSearchFilters,
  type MarketplaceSearchFilters,
} from "@/lib/utils/marketplaceSearch";

const COLLECTIONS = {
  technical: "technical_service_listings",
  spare: "spare_part_listings",
} as const;

export async function searchPublishedMarketplaceAdmin(
  variant: keyof typeof COLLECTIONS,
  query: string,
  filters: MarketplaceSearchFilters = {},
): Promise<MarketplaceProfile[]> {
  return searchPublishedCollection({
    collectionName: COLLECTIONS[variant],
    query,
    mapDoc: mapMarketplaceDocToProfile,
    matchesQuery: marketplaceMatchesSearchQuery,
    passesFilters: (item) => passesMarketplaceSearchFilters(item, filters),
    sortBy: (a, b) => a.name.localeCompare(b.name, "tr"),
  });
}
