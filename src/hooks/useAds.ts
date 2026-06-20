"use client";

import { useEffect, useState } from "react";
import type { Ad } from "@/types/ad";
import { getAdsPage } from "@/services/adService";
import type { AdCursor } from "@/lib/firestore/ads";

type UseAdsParams = {
  city?: string;
  category?: string;
  pageSize?: number;
};

export function useAds({ city, category, pageSize = 20 }: UseAdsParams = {}) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<AdCursor>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchInitial = async () => {
      setLoading(true);
      const result = await getAdsPage({ city, category, pageSize });

      if (!isMounted) {
        return;
      }

      setAds(result.ads);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      setLoading(false);
    };

    void fetchInitial();

    return () => {
      isMounted = false;
    };
  }, [city, category, pageSize]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) {
      return;
    }

    setLoadingMore(true);
    const result = await getAdsPage({ city, category, pageSize, lastDoc });

    setAds((prev) => [...prev, ...result.ads]);
    setLastDoc(result.lastDoc);
    setHasMore(result.hasMore);
    setLoadingMore(false);
  };

  return { ads, loading, loadingMore, hasMore, loadMore };
}
