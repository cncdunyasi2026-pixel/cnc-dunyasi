"use client";

import { useCallback, useEffect, useState } from "react";
import { isFirebaseClientConfigured } from "@/lib/firebase";

export type PaginatedPageResult<T> = {
  items: T[];
  lastDoc: unknown;
  hasMore: boolean;
};

export type PaginatedFetchParams = {
  pageSize?: number;
  lastDoc?: unknown;
  offset?: number;
};

const DEFAULT_PAGE_SIZE = 24;

export function usePaginatedBrowse<T>(
  fetchPage: (params: PaginatedFetchParams) => Promise<PaginatedPageResult<T>>,
  deps: readonly unknown[] = [],
  pageSize = DEFAULT_PAGE_SIZE,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setLastDoc(null);

    void fetchPage({ pageSize, offset: 0 })
      .then((result) => {
        if (cancelled) return;
        setItems(result.items);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Liste yüklenemedi.");
        setItems([]);
        setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps intentionally drive refetch
  }, [fetchPage, pageSize, ...deps]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;

    setLoadingMore(true);
    setError(null);

    try {
      const result = await fetchPage({
        pageSize,
        lastDoc: isFirebaseClientConfigured ? lastDoc : undefined,
        offset: isFirebaseClientConfigured ? undefined : items.length,
      });

      setItems((prev) => [...prev, ...result.items]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Daha fazla kayıt yüklenemedi.");
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, items.length, lastDoc, loading, loadingMore, pageSize]);

  return { items, loading, loadingMore, hasMore, loadMore, error };
}
