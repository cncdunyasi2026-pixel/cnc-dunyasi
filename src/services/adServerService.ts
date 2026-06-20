import "server-only";
import { mapAdSnapshotToAd } from "@/lib/firestore/mapAdDoc";
import { isListingPublishedPublic } from "@/lib/firestore/listingVisibility";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";
import { mockAds } from "@/lib/mocks/ads";
import type { Ad } from "@/types/ad";

export async function getServerAdById(id: string): Promise<Ad | null> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return mockAds.find((item) => item.id === id) ?? null;
  }

  try {
    const snap = await adminDb.collection("ads").doc(id).get();

    if (!snap.exists) {
      return null;
    }

    const d = snap.data() as Record<string, unknown>;
    if (!isListingPublishedPublic(d)) {
      return null;
    }

    return mapAdSnapshotToAd(snap.id, d);
  } catch (error) {
    console.error("[getServerAdById]", id, error);
    return null;
  }
}
