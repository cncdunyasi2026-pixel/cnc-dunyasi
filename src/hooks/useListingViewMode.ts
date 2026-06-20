"use client";

import { useCallback, useEffect, useState } from "react";

export type ListingViewMode = "card" | "list";

const STORAGE_KEY = "cncdunyam-listing-view-mode";
const DEFAULT_MODE: ListingViewMode = "card";

function readStoredMode(): ListingViewMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "card" || value === "list") return value;
  } catch {
    // localStorage kullanılamıyorsa varsayılan
  }
  return DEFAULT_MODE;
}

export function useListingViewMode() {
  const [viewMode, setViewModeState] = useState<ListingViewMode>(DEFAULT_MODE);

  useEffect(() => {
    setViewModeState(readStoredMode());
  }, []);

  const setViewMode = useCallback((mode: ListingViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }, []);

  return { viewMode, setViewMode };
}
