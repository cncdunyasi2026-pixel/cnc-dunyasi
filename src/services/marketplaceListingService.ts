import {
  createSparePartListingDoc,
  createTechnicalServiceListingDoc,
} from "@/lib/firestore/marketplaceListings";
import { isFirebaseClientConfigured } from "@/lib/firebase";
import type { MarketplaceListingRecord } from "@/types/marketplaceListing";

export async function submitTechnicalServiceListing(data: MarketplaceListingRecord) {
  if (!isFirebaseClientConfigured) {
    throw new Error("Firebase tasarim modunda devre disi. Ilan icin .env.local tanimlayin.");
  }
  return createTechnicalServiceListingDoc(data);
}

export async function submitSparePartListing(data: MarketplaceListingRecord) {
  if (!isFirebaseClientConfigured) {
    throw new Error("Firebase tasarim modunda devre disi. Ilan icin .env.local tanimlayin.");
  }
  return createSparePartListingDoc(data);
}
