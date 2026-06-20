"use client";

import { useCallback, useEffect, useState } from "react";
import type { Ad } from "@/types/ad";
import type { AdServerFilters } from "@/types/adBrowse";
import { adServerFiltersKey } from "@/types/adBrowse";
import { getAdsPage } from "@/services/adService";
import type { AdCursor } from "@/lib/firestore/ads";
import { isFirebaseClientConfigured } from "@/lib/firebase";

const DEFAULT_PAGE_SIZE = 24;

export function useAdBrowse(serverFilters: AdServerFilters, pageSize = DEFAULT_PAGE_SIZE) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<AdCursor>(null);

  const filtersKey = adServerFiltersKey(serverFilters);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setLastDoc(null);

    void getAdsPage({ ...serverFilters, pageSize, offset: 0 })
      .then((result) => {
        if (cancelled) return;
        setAds(result.ads);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "İlanlar yüklenemedi.");
        setAds([]);
        setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filtersKey, pageSize, serverFilters]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;

    setLoadingMore(true);
    setError(null);

    try {
      const result = await getAdsPage({
        ...serverFilters,
        pageSize,
        lastDoc: isFirebaseClientConfigured ? lastDoc : undefined,
        offset: isFirebaseClientConfigured ? undefined : ads.length,
      });

      setAds((prev) => [...prev, ...result.ads]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Daha fazla ilan yüklenemedi.");
    } finally {
      setLoadingMore(false);
    }
  }, [ads.length, hasMore, lastDoc, loading, loadingMore, pageSize, serverFilters]);

  return { ads, loading, loadingMore, hasMore, loadMore, error };
}
