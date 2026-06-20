"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readBrowserCache,
  readPaginationCursor,
  writeBrowserCache,
  writePaginationCursor,
} from "@/lib/cache/browserCache";
import { CACHE_POLICIES } from "@/lib/cache/policies";
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

type CachedFirstPage<T> = {
  items: T[];
  hasMore: boolean;
};

const DEFAULT_PAGE_SIZE = 24;
const LISTINGS_CACHE_POLICY = CACHE_POLICIES.listingsPage1;

export function usePaginatedBrowse<T>(
  fetchPage: (params: PaginatedFetchParams) => Promise<PaginatedPageResult<T>>,
  deps: readonly unknown[] = [],
  pageSize = DEFAULT_PAGE_SIZE,
  cacheKey?: string,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<unknown>(null);

  const persistFirstPage = useCallback(
    (result: PaginatedPageResult<T>) => {
      if (!cacheKey) return;
      writeBrowserCache<CachedFirstPage<T>>(
        cacheKey,
        { items: result.items, hasMore: result.hasMore },
        LISTINGS_CACHE_POLICY,
      );
      writePaginationCursor(cacheKey, result.lastDoc ?? null);
    },
    [cacheKey],
  );

  const applyFirstPage = useCallback((result: PaginatedPageResult<T>, cursor: unknown) => {
    setItems(result.items);
    setHasMore(result.hasMore);
    setLastDoc(cursor);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchAndApply = async (showLoading: boolean) => {
      if (showLoading) {
        setLoading(true);
        setLastDoc(null);
      }
      setError(null);

      try {
        const result = await fetchPage({ pageSize, offset: 0 });
        if (cancelled) return;
        applyFirstPage(result, result.lastDoc ?? null);
        persistFirstPage(result);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Liste yüklenemedi.");
        setItems([]);
        setHasMore(false);
      } finally {
        if (!cancelled && showLoading) {
          setLoading(false);
        }
      }
    };

    if (cacheKey) {
      const cached = readBrowserCache<CachedFirstPage<T>>(cacheKey, LISTINGS_CACHE_POLICY);
      if (cached) {
        const cursor = readPaginationCursor(cacheKey);
        applyFirstPage(
          { items: cached.data.items, hasMore: cached.data.hasMore, lastDoc: null },
          cursor === undefined ? null : cursor,
        );
        setLoading(false);

        if (cached.isStale) {
          void fetchAndApply(false);
        }
        return () => {
          cancelled = true;
        };
      }
    }

    void fetchAndApply(true);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps intentionally drive refetch
  }, [applyFirstPage, cacheKey, fetchPage, pageSize, persistFirstPage, ...deps]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;

    setLoadingMore(true);
    setError(null);

    try {
      let cursor = lastDoc;

      if (isFirebaseClientConfigured && cacheKey && readPaginationCursor(cacheKey) === undefined) {
        const refreshed = await fetchPage({ pageSize, offset: 0 });
        applyFirstPage(refreshed, refreshed.lastDoc ?? null);
        persistFirstPage(refreshed);
        if (!refreshed.hasMore) return;
        cursor = refreshed.lastDoc ?? null;
      }

      const result = await fetchPage({
        pageSize,
        lastDoc: isFirebaseClientConfigured ? cursor : undefined,
        offset: isFirebaseClientConfigured ? undefined : items.length,
      });

      setItems((prev) => [...prev, ...result.items]);
      setLastDoc(result.lastDoc ?? null);
      setHasMore(result.hasMore);

      if (cacheKey) {
        writePaginationCursor(cacheKey, result.lastDoc ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Daha fazla kayıt yüklenemedi.");
    } finally {
      setLoadingMore(false);
    }
  }, [
    applyFirstPage,
    cacheKey,
    fetchPage,
    hasMore,
    items.length,
    lastDoc,
    loading,
    loadingMore,
    pageSize,
    persistFirstPage,
  ]);

  return { items, loading, loadingMore, hasMore, loadMore, error };
}
