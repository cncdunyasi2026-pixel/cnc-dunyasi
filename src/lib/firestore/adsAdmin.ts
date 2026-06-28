import "server-only";

import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";
import { mapAdSnapshotToAd } from "@/lib/firestore/mapAdDoc";
import { isAdPublishedPublic } from "@/lib/firestore/listingVisibility";
import type { Ad } from "@/types/ad";

export async function getPublishedAdByIdAdmin(id: string): Promise<Ad | null> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return null;
  }

  const snap = await adminDb.collection("ads").doc(id).get();
  if (!snap.exists) {
    return null;
  }

  const ad = mapAdSnapshotToAd(snap.id, snap.data() as Record<string, unknown>);
  if (!isAdPublishedPublic(ad.status)) {
    return null;
  }

  return ad;
}
