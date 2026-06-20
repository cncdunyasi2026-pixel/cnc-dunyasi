"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdDetailContent from "@/components/ad/AdDetailContent";
import RelatedAdsSection from "@/components/ad/RelatedAdsSection";
import { getAdById } from "@/services/adService";
import { trackAdClick } from "@/services/listingAnalyticsService";
import { isAdPublishedPublic } from "@/lib/firestore/listingVisibility";
import type { Ad } from "@/types/ad";

type Props = {
  slug: string;
  publishedAd: Ad | null;
  legacyAd: Ad | null;
};

export default function AdDetailLoader({ slug, publishedAd, legacyAd }: Props) {
  const [clientAd, setClientAd] = useState<Ad | null | undefined>(undefined);

  useEffect(() => {
    if (publishedAd || legacyAd) {
      setClientAd(null);
      return;
    }

    let cancelled = false;
    void getAdById(slug).then((ad) => {
      if (cancelled) return;
      // Sadece yayındaki ilanı göster; archived/pending vb. "bulunamadı" gibi davran
      setClientAd(ad && isAdPublishedPublic(ad.status) ? ad : null);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, publishedAd, legacyAd]);

  useEffect(() => {
    const ad = publishedAd ?? legacyAd ?? (clientAd === undefined ? null : clientAd);
    if (!ad || !ad.id) return;
    void trackAdClick(ad.id).catch(() => {});
  }, [publishedAd, legacyAd, clientAd]);

  const ad =
    publishedAd ?? legacyAd ?? (clientAd === undefined ? undefined : clientAd);

  if (ad === undefined) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm font-semibold text-[#7A8CA5]">Yükleniyor...</p>
      </div>
    );
  }

  if (ad === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-bold text-[#0F2A4A]">İlan bulunamadı</p>
        <Link href="/ilanlar" className="mt-4 inline-block text-sm font-semibold text-[#F26A1B] hover:underline">
          İlanlara dön
        </Link>
      </div>
    );
  }

  return (
    <>
      <AdDetailContent ad={ad} />
      <RelatedAdsSection adId={ad.id} category={ad.category} />
    </>
  );
}
