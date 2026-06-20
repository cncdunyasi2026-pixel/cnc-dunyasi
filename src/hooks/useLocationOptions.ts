"use client";

import { useCallback, useEffect, useState } from "react";
import type { District, NeighborhoodOption, Province } from "@/lib/locations/types";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Konum verisi alınamadı.");
  }
  return response.json() as Promise<T>;
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
    void fetchJson<Province[]>("/api/locations/provinces")
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
    void fetchJson<District[]>(`/api/locations/districts?ilId=${encodeURIComponent(provinceId)}`)
      .then(setDistricts)
      .catch((err) => setError(err instanceof Error ? err.message : "İlçe listesi yüklenemedi."))
      .finally(() => setLoadingDistricts(false));
  }, []);

  const loadNeighborhoods = useCallback((districtId: string) => {
    setNeighborhoods([]);
    if (!districtId) return;

    setLoadingNeighborhoods(true);
    void fetchJson<NeighborhoodOption[]>(
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
