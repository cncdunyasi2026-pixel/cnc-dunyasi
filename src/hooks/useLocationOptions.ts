"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWithBrowserCache } from "@/lib/cache/browserCache";
import { LOCATION_CACHE_POLICY } from "@/lib/cache/locationCache";
import type { District, NeighborhoodOption, Province } from "@/lib/locations/types";

async function fetchJsonCached<T>(cacheKey: string, url: string): Promise<T> {
  const { data } = await fetchWithBrowserCache(
    cacheKey,
    LOCATION_CACHE_POLICY,
    async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Konum verisi alınamadı.");
      }
      return response.json() as Promise<T>;
    },
  );
  return data;
}

export function useLocationOptions() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodOption[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoadingProvinces(true);
    void fetchJsonCached<Province[]>("locations:provinces", "/api/locations/provinces")
      .then((data) => {
        if (active) setProvinces(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "İl listesi yüklenemedi.");
      })
      .finally(() => {
        if (active) setLoadingProvinces(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const loadDistricts = useCallback((provinceId: string) => {
    setDistricts([]);
    setNeighborhoods([]);
    if (!provinceId) return;

    setLoadingDistricts(true);
    void fetchJsonCached<District[]>(
      `locations:districts:${provinceId}`,
      `/api/locations/districts?ilId=${encodeURIComponent(provinceId)}`,
    )
      .then(setDistricts)
      .catch((err) => setError(err instanceof Error ? err.message : "İlçe listesi yüklenemedi."))
      .finally(() => setLoadingDistricts(false));
  }, []);

  const loadNeighborhoods = useCallback((districtId: string) => {
    setNeighborhoods([]);
    if (!districtId) return;

    setLoadingNeighborhoods(true);
    void fetchJsonCached<NeighborhoodOption[]>(
      `locations:neighborhoods:${districtId}`,
      `/api/locations/neighborhoods?ilceId=${encodeURIComponent(districtId)}`,
    )
      .then(setNeighborhoods)
      .catch((err) => setError(err instanceof Error ? err.message : "Mahalle listesi yüklenemedi."))
      .finally(() => setLoadingNeighborhoods(false));
  }, []);

  return {
    provinces,
    districts,
    neighborhoods,
    loadingProvinces,
    loadingDistricts,
    loadingNeighborhoods,
    error,
    loadDistricts,
    loadNeighborhoods,
  };
}
