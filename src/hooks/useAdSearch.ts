"use client";

import { useEffect, useState } from "react";
import type { Ad } from "@/types/ad";
import type { AdServerFilters } from "@/types/adBrowse";
import { adServerFiltersKey } from "@/types/adBrowse";
import { searchAds } from "@/services/adSearchService";

export function useAdSearch(activeQuery: string, serverFilters: AdServerFilters) {
  const [results, setResults] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = adServerFiltersKey(serverFilters);
  const trimmedQuery = activeQuery.trim();

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

    void searchAds({ query: trimmedQuery, ...serverFilters })
      .then((ads) => {
        if (cancelled) return;
        setResults(ads);
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
  }, [trimmedQuery, filtersKey, serverFilters]);

  return { results, loading, error, isActive: trimmedQuery.length > 0 };
}
