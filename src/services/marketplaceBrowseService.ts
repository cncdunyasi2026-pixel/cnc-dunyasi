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

export async function getRelatedMarketplaceProfiles(
  variant: "technical" | "spare",
  current: Pick<
    MarketplaceProfile,
    "id" | "slug" | "category" | "partCategory" | "serviceType" | "expertiseBrand" | "brandCompat"
  >,
  limit = 4,
): Promise<MarketplaceProfile[]> {
  const loadPage =
    variant === "technical" ? loadTechnicalBrowseProfilesPage : loadSparePartBrowseProfilesPage;

  const { items: published } = await loadPage({ pageSize: Math.max(limit + 8, 24) });

  const pool = published.filter(
    (item) => item.id !== current.id && item.slug !== current.slug,
  );

  if (pool.length === 0) {
    return [];
  }

  const matchers: Array<(item: MarketplaceProfile) => boolean> = [];

  if (variant === "spare" && current.partCategory) {
    matchers.push((item) => item.partCategory === current.partCategory);
  }
  if (variant === "spare" && current.brandCompat) {
    matchers.push((item) => item.brandCompat === current.brandCompat);
  }
  if (variant === "technical" && current.serviceType) {
    matchers.push((item) => item.serviceType === current.serviceType);
  }
  if (variant === "technical" && current.expertiseBrand) {
    matchers.push((item) => item.expertiseBrand === current.expertiseBrand);
  }
  if (current.category.trim()) {
    matchers.push((item) => item.category === current.category);
  }

  for (const match of matchers) {
    const matched = pool.filter(match);
    if (matched.length > 0) {
      return matched.slice(0, limit);
    }
  }

  return pool.slice(0, limit);
}
