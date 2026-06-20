"use client";

import { useEffect, useState } from "react";
import { searchMarketplace, type SearchMarketplaceParams } from "@/services/marketplaceSearchService";
import type { MarketplaceProfile } from "@/types/marketplace";
import type { MarketplaceSearchFilters } from "@/lib/utils/marketplaceSearch";

export function useMarketplaceSearch(
  variant: "technical" | "spare",
  activeQuery: string,
  filters: MarketplaceSearchFilters = {},
) {
  const [results, setResults] = useState<MarketplaceProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedQuery = activeQuery.trim();
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    if (!trimmedQuery) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const params: SearchMarketplaceParams = { variant, query: trimmedQuery, ...filters };

    void searchMarketplace(params)
      .then((items) => {
        if (cancelled) return;
        setResults(items);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Arama yapılamadı.");
        setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [variant, trimmedQuery, filtersKey]);

  return { results, loading, error, isActive: trimmedQuery.length > 0 };
}
