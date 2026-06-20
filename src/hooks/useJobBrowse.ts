"use client";

import { useCallback } from "react";
import { usePaginatedBrowse } from "@/hooks/usePaginatedBrowse";
import { loadPublishedJobListingsPage } from "@/services/jobListingService";

export function useJobBrowse() {
  const fetchPage = useCallback(
    (params: Parameters<typeof loadPublishedJobListingsPage>[0]) =>
      loadPublishedJobListingsPage(params),
    [],
  );

  return usePaginatedBrowse(fetchPage, []);
}
