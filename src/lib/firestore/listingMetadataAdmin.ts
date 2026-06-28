import "server-only";

import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";
import { mapJobListingFromFirestore } from "@/lib/firestore/mapJobDoc";
import { mapMarketplaceDocToProfile } from "@/lib/firestore/mapMarketplaceDoc";
import type { JobListing } from "@/types/job";
import type { MarketplaceProfile } from "@/types/marketplace";

async function getPublishedBySlugAdmin<T>(
  collectionName: string,
  slug: string,
  mapDoc: (id: string, data: Record<string, unknown>) => T,
): Promise<T | null> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return null;
  }

  const snap = await adminDb
    .collection(collectionName)
    .where("slug", "==", slug)
    .where("status", "==", "published")
    .limit(1)
    .get();

  if (snap.empty) {
    return null;
  }

  const doc = snap.docs[0];
  return mapDoc(doc.id, doc.data() as Record<string, unknown>);
}

export async function getPublishedJobBySlugAdmin(slug: string): Promise<JobListing | null> {
  return getPublishedBySlugAdmin("job_listings", slug, mapJobListingFromFirestore);
}

export async function getPublishedTechnicalListingBySlugAdmin(
  slug: string,
): Promise<MarketplaceProfile | null> {
  return getPublishedBySlugAdmin(
    "technical_service_listings",
    slug,
    mapMarketplaceDocToProfile,
  );
}

export async function getPublishedSparePartListingBySlugAdmin(
  slug: string,
): Promise<MarketplaceProfile | null> {
  return getPublishedBySlugAdmin("spare_part_listings", slug, mapMarketplaceDocToProfile);
}
