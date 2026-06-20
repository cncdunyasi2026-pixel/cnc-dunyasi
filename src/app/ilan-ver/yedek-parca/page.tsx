"use client";

import ListingPublishShell from "@/components/listing/ListingPublishShell";
import MarketplaceListingForm from "@/components/listing/MarketplaceListingForm";
import { submitSparePartListing } from "@/services/marketplaceListingService";

export default function YedekParcaIlanVerPage() {
  return (
    <ListingPublishShell
      eyebrow="YEDEK PARÇA"
      title="Firma profili oluştur"
      subtitle="Stok ve uzmanlık alanlarını anlatan bir profille yedek parça vitrinine katıl."
    >
      <MarketplaceListingForm
        category="Yedek Parca"
        storageFolder="spare-part-images"
        submitListing={(data) => submitSparePartListing(data)}
      />
    </ListingPublishShell>
  );
}
