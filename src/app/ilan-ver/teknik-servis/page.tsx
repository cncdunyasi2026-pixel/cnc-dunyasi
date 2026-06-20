"use client";

import ListingPublishShell from "@/components/listing/ListingPublishShell";
import MarketplaceListingForm from "@/components/listing/MarketplaceListingForm";
import { submitTechnicalServiceListing } from "@/services/marketplaceListingService";

export default function TeknikServisIlanVerPage() {
  return (
    <ListingPublishShell
      eyebrow="TEKNİK SERVİS"
      title="Servis profili oluştur"
      subtitle="Uzmanlıklarını ve iletişim bilgilerini ekleyerek CNC servis ilanın yayına hazır olsun."
    >
      <MarketplaceListingForm
        category="Teknik Servis"
        storageFolder="technical-service-images"
        submitListing={(data) => submitTechnicalServiceListing(data)}
      />
    </ListingPublishShell>
  );
}
