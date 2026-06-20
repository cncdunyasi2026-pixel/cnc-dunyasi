"use client";

import { useCallback } from "react";
import type { AdServerFilters } from "@/types/adBrowse";
import { adServerFiltersKey } from "@/types/adBrowse";
import { getAdsPage } from "@/services/adService";
import type { AdCursor } from "@/lib/firestore/ads";
import { usePaginatedBrowse, type PaginatedFetchParams } from "@/hooks/usePaginatedBrowse";

const DEFAULT_PAGE_SIZE = 24;

export function useAdBrowse(serverFilters: AdServerFilters, pageSize = DEFAULT_PAGE_SIZE) {
  const filtersKey = adServerFiltersKey(serverFilters);

  const fetchPage = useCallback(
    async (params: PaginatedFetchParams) => {
      const result = await getAdsPage({
        ...serverFilters,
        ...params,
        lastDoc: params.lastDoc as AdCursor | undefined,
      });
      return {
        items: result.ads,
        lastDoc: result.lastDoc,
        hasMore: result.hasMore,
      };
    },
    [serverFilters],
  );

  const browse = usePaginatedBrowse(
    fetchPage,
    [filtersKey],
    pageSize,
    `listings:ads:${filtersKey}`,
  );

  return {
    ads: browse.items,
    loading: browse.loading,
    loadingMore: browse.loadingMore,
    hasMore: browse.hasMore,
    loadMore: browse.loadMore,
    error: browse.error,
  };
}
