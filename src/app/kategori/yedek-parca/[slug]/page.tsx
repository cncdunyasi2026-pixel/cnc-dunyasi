"use client";

import { use } from "react";
import MarketplaceDetailLoader from "@/components/marketplace/MarketplaceDetailLoader";
import { sparePartFirms } from "@/lib/mocks/marketplace";

type Props = {
  params: Promise<{ slug: string }>;
};

export default function SparePartDetailPage({ params }: Props) {
  const { slug } = use(params);
  const legacyItem = sparePartFirms.find((profile) => profile.slug === slug) ?? null;

  return (
    <MarketplaceDetailLoader
      slug={slug}
      variant="spare"
      publishedItem={null}
      legacyItem={legacyItem}
      listPath="/kategori/yedek-parca"
    />
  );
}
