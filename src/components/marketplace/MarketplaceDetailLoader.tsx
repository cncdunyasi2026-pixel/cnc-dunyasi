"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MarketplaceDetailContent from "@/components/marketplace/MarketplaceDetailContent";
import RelatedMarketplaceSection from "@/components/marketplace/RelatedMarketplaceSection";
import {
  getSparePartListingBySlugClient,
  getTechnicalListingBySlugClient,
} from "@/lib/firestore/marketplaceListings";
import type { MarketplaceProfile } from "@/types/marketplace";

type Props = {
  slug: string;
  variant: "technical" | "spare";
  publishedItem: MarketplaceProfile | null;
  legacyItem: MarketplaceProfile | null;
  listPath: string;
};

export default function MarketplaceDetailLoader({
  slug,
  variant,
  publishedItem,
  legacyItem,
  listPath,
}: Props) {
  const [clientItem, setClientItem] = useState<MarketplaceProfile | null | undefined>(undefined);

  useEffect(() => {
    if (publishedItem || legacyItem) {
      setClientItem(null);
      return;
    }

    const fetchListing =
      variant === "technical" ? getTechnicalListingBySlugClient : getSparePartListingBySlugClient;

    let cancelled = false;
    void fetchListing(slug).then((item) => {
      if (!cancelled) setClientItem(item ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, variant, publishedItem, legacyItem]);

  const item =
    publishedItem ??
    legacyItem ??
    (clientItem === undefined ? undefined : clientItem);

  if (item === undefined) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm font-semibold text-[#7A8CA5]">Yükleniyor...</p>
      </div>
    );
  }

  if (item === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-bold text-[#0F2A4A]">Kayıt bulunamadı</p>
        <Link href={listPath} className="mt-4 inline-block text-sm font-semibold text-[#F26A1B] hover:underline">
          Listeye dön
        </Link>
      </div>
    );
  }

  return (
    <>
      <MarketplaceDetailContent item={item} listPath={listPath} />
      <RelatedMarketplaceSection
        variant={variant}
        itemId={item.id}
        category={item.category}
        listPath={listPath}
      />
    </>
  );
}
