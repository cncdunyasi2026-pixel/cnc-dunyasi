import { isFirebaseClientConfigured } from "@/lib/firebase";
import {
  getPublishedSparePartProfilesPage,
  getPublishedTechnicalProfilesPage,
  type ListingCursor,
  type ListingPageResult,
} from "@/lib/firestore/marketplaceListings";
import type { MarketplaceProfile } from "@/types/marketplace";
import { sparePartFirms, technicalServiceProfiles } from "@/lib/mocks/marketplace";
import type { PaginatedFetchParams } from "@/hooks/usePaginatedBrowse";

const DEFAULT_PAGE_SIZE = 24;

function mockMarketplacePage(
  pool: MarketplaceProfile[],
  params: PaginatedFetchParams,
): ListingPageResult {
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = params.offset ?? 0;
  const page = pool.slice(offset, offset + pageSize);

  return {
    items: page,
    lastDoc: null,
    hasMore: offset + pageSize < pool.length,
  };
}

export async function loadTechnicalBrowseProfilesPage(
  params: PaginatedFetchParams = {},
): Promise<ListingPageResult> {
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

  if (!isFirebaseClientConfigured) {
    return mockMarketplacePage(technicalServiceProfiles, params);
  }

  return getPublishedTechnicalProfilesPage(pageSize, (params.lastDoc as ListingCursor) ?? null);
}

export async function loadSparePartBrowseProfilesPage(
  params: PaginatedFetchParams = {},
): Promise<ListingPageResult> {
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

  if (!isFirebaseClientConfigured) {
    return mockMarketplacePage(sparePartFirms, params);
  }

  return getPublishedSparePartProfilesPage(pageSize, (params.lastDoc as ListingCursor) ?? null);
}

export async function loadTechnicalBrowseProfiles(): Promise<MarketplaceProfile[]> {
  const { items } = await loadTechnicalBrowseProfilesPage({ pageSize: 60 });
  return items;
}

export async function loadSparePartBrowseProfiles(): Promise<MarketplaceProfile[]> {
  const { items } = await loadSparePartBrowseProfilesPage({ pageSize: 60 });
  return items;
}
