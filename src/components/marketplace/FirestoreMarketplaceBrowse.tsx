"use client";

import { useEffect, useState } from "react";
import MarketplaceBrowsePanel from "@/components/marketplace/MarketplaceBrowsePanel";
import {
  loadSparePartBrowseProfiles,
  loadTechnicalBrowseProfiles,
} from "@/services/marketplaceBrowseService";
import type { MarketplaceProfile } from "@/types/marketplace";

type Props = {
  variant: "technical" | "spare";
  basePath: string;
  searchPlaceholder: string;
  singleImage?: boolean;
};

export default function FirestoreMarketplaceBrowse({ variant, basePath, searchPlaceholder, singleImage }: Props) {
  const [items, setItems] = useState<MarketplaceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const loader = variant === "technical" ? loadTechnicalBrowseProfiles : loadSparePartBrowseProfiles;
    void loader()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Liste yüklenemedi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [variant]);

  if (loading) {
    return (
      <p className="rounded-xl border border-[#dbe2ea] bg-white px-4 py-6 text-center text-sm font-semibold text-[#7A8CA5]">
        İlanlar yükleniyor...
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p>
    );
  }

  return (
    <MarketplaceBrowsePanel
      items={items}
      basePath={basePath}
      searchPlaceholder={searchPlaceholder}
      singleImage={singleImage}
    />
  );
}
