import "server-only";

import type { Query, DocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { mapAdSnapshotToAd } from "@/lib/firestore/mapAdDoc";
import type { Ad } from "@/types/ad";
import type { AdServerFilters } from "@/types/adBrowse";
import {
  adMatchesSearchQuery,
  passesAdServerFilters,
  pickPrimarySearchToken,
} from "@/lib/utils/adSearch";

const SCAN_BATCH_SIZE = 400;
const MAX_RESULTS = 500;

async function scanPublishedAds(
  onBatch: (ads: Ad[]) => void,
  filters: AdServerFilters,
): Promise<void> {
  if (!adminDb) return;

  let lastDoc: DocumentSnapshot | null = null;

  while (true) {
    let q: Query = adminDb
      .collection("ads")
      .where("status", "==", "published")
      .orderBy("createdAt", "desc")
      .limit(SCAN_BATCH_SIZE);

    if (lastDoc) {
      q = q.startAfter(lastDoc);
    }

    const snap = await q.get();
    if (snap.empty) break;

    const batchAds = snap.docs
      .map((doc) => mapAdSnapshotToAd(doc.id, doc.data() as Record<string, unknown>))
      .filter((ad) => passesAdServerFilters(ad, filters));

    onBatch(batchAds);

    lastDoc = snap.docs[snap.docs.length - 1] ?? null;
    if (snap.size < SCAN_BATCH_SIZE) break;
  }
}

async function queryBySearchToken(
  token: string,
  filters: AdServerFilters,
): Promise<Ad[]> {
  if (!adminDb) return [];

  const snap = await adminDb
    .collection("ads")
    .where("status", "==", "published")
    .where("searchTokens", "array-contains", token)
    .orderBy("createdAt", "desc")
    .limit(MAX_RESULTS)
    .get();

  return snap.docs
    .map((doc) => mapAdSnapshotToAd(doc.id, doc.data() as Record<string, unknown>))
    .filter((ad) => passesAdServerFilters(ad, filters));
}

export async function searchPublishedAdsAdmin(
  query: string,
  filters: AdServerFilters = {},
): Promise<Ad[]> {
  if (!adminDb) {
    throw new Error("Sunucu araması yapılandırılmamış.");
  }

  const trimmed = query.trim();
  if (!trimmed) return [];

  const primaryToken = pickPrimarySearchToken(trimmed);
  const matched = new Map<string, Ad>();

  const collect = (ads: Ad[]) => {
    for (const ad of ads) {
      if (!adMatchesSearchQuery(ad, trimmed)) continue;
      matched.set(ad.id, ad);
      if (matched.size >= MAX_RESULTS) return;
    }
  };

  if (primaryToken) {
    try {
      collect(await queryBySearchToken(primaryToken, filters));
    } catch {
      /* Index henüz yoksa tam taramaya düş. */
    }
  }

  if (matched.size < MAX_RESULTS) {
    await scanPublishedAds((batch) => {
      if (matched.size >= MAX_RESULTS) return;
      collect(batch);
    }, filters);
  }

  return [...matched.values()].sort((a, b) => b.createdAt - a.createdAt);
}
