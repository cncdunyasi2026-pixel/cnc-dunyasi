import "server-only";

import { isListingPublishedPublic } from "@/lib/firestore/listingVisibility";
import { mapJobListingFromFirestore } from "@/lib/firestore/mapJobDoc";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";
import type { JobListing } from "@/types/job";

export async function getServerJobBySlug(slug: string): Promise<JobListing | null> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return null;
  }

  try {
    const snapshot = await adminDb.collection("job_listings").where("slug", "==", slug).limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data() as Record<string, unknown>;

    if (!isListingPublishedPublic(data)) {
      return null;
    }

    return mapJobListingFromFirestore(doc.id, data);
  } catch (error) {
    console.error("[getServerJobBySlug]", slug, error);
    return null;
  }
}
