"use client";

import { useCallback } from "react";
import { usePaginatedBrowse } from "@/hooks/usePaginatedBrowse";
import {
  loadSparePartBrowseProfilesPage,
  loadTechnicalBrowseProfilesPage,
} from "@/services/marketplaceBrowseService";

export function useMarketplaceBrowse(variant: "technical" | "spare") {
  const fetchPage = useCallback(
    (params: Parameters<typeof loadTechnicalBrowseProfilesPage>[0]) =>
      variant === "technical"
        ? loadTechnicalBrowseProfilesPage(params)
        : loadSparePartBrowseProfilesPage(params),
    [variant],
  );

  return usePaginatedBrowse(fetchPage, [variant], 24, `listings:marketplace:${variant}`);
}
