"use client";

import { use } from "react";
import MarketplaceDetailLoader from "@/components/marketplace/MarketplaceDetailLoader";
import { technicalServiceProfiles } from "@/lib/mocks/marketplace";

type Props = {
  params: Promise<{ slug: string }>;
};

export default function TechnicalServiceDetailPage({ params }: Props) {
  const { slug } = use(params);
  const legacyItem = technicalServiceProfiles.find((profile) => profile.slug === slug) ?? null;

  return (
    <MarketplaceDetailLoader
      slug={slug}
      variant="technical"
      publishedItem={null}
      legacyItem={legacyItem}
      listPath="/kategori/teknik-servis"
    />
  );
}
