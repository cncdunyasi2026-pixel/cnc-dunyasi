"use client";

import { use } from "react";
import AdDetailLoader from "@/components/ad/AdDetailLoader";
import { getLegacyListingBySlug } from "@/lib/mocks/adLegacy";

type Props = {
  params: Promise<{ slug: string }>;
};

export default function AdDetailPage({ params }: Props) {
  const { slug } = use(params);
  const legacyAd = getLegacyListingBySlug(slug);

  return <AdDetailLoader slug={slug} publishedAd={null} legacyAd={legacyAd} />;
}
