import "server-only";

import { isListingPublishedPublic } from "@/lib/firestore/listingVisibility";
import { mapMarketplaceDocToProfile } from "@/lib/firestore/mapMarketplaceDoc";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";
import type { MarketplaceProfile } from "@/types/marketplace";

async function fetchPublishedMarketplaceBySlug(
  collection: "technical_service_listings" | "spare_part_listings",
  slug: string,
): Promise<MarketplaceProfile | null> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return null;
  }

  try {
    const snapshot = await adminDb.collection(collection).where("slug", "==", slug).limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    const raw = docSnap.data() as Record<string, unknown>;
    if (!isListingPublishedPublic(raw)) {
      return null;
    }

    return mapMarketplaceDocToProfile(docSnap.id, raw);
  } catch (error) {
    console.error("[fetchPublishedMarketplaceBySlug]", collection, slug, error);
    return null;
  }
}

export async function getServerTechnicalProfileBySlug(slug: string): Promise<MarketplaceProfile | null> {
  return fetchPublishedMarketplaceBySlug("technical_service_listings", slug);
}

export async function getServerSparePartProfileBySlug(slug: string): Promise<MarketplaceProfile | null> {
  return fetchPublishedMarketplaceBySlug("spare_part_listings", slug);
}
