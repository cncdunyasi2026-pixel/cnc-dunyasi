import { isFirebaseClientConfigured } from "@/lib/firebase";
import {
  getPublishedSparePartProfiles,
  getPublishedTechnicalProfiles,
} from "@/lib/firestore/marketplaceListings";
import type { MarketplaceProfile } from "@/types/marketplace";
import { sparePartFirms, technicalServiceProfiles } from "@/lib/mocks/marketplace";

export async function loadTechnicalBrowseProfiles(): Promise<MarketplaceProfile[]> {
  if (!isFirebaseClientConfigured) {
    return technicalServiceProfiles;
  }
  return getPublishedTechnicalProfiles();
}

export async function loadSparePartBrowseProfiles(): Promise<MarketplaceProfile[]> {
  if (!isFirebaseClientConfigured) {
    return sparePartFirms;
  }
  return getPublishedSparePartProfiles();
}
