import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Ad } from "@/types/ad";
import { mapAdSnapshotToAd } from "@/lib/firestore/mapAdDoc";

export type AdCreateInput = Omit<Ad, "id" | "createdAt">;

export function mapDocToAd(id: string, data: Record<string, unknown>): Ad {
  return mapAdSnapshotToAd(id, data);
}

export type AdCursor = QueryDocumentSnapshot<DocumentData> | null;

type AdFilters = {
  city?: string;
  category?: string;
  pageSize?: number;
  lastDoc?: AdCursor;
};

export type AdPageResult = {
  ads: Ad[];
  lastDoc: AdCursor;
  hasMore: boolean;
};

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  );
}

export async function createAdDoc(data: AdCreateInput) {
  return addDoc(collection(db, "ads"), stripUndefined({
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as Record<string, unknown>));
}

export async function getAdDocById(id: string): Promise<Ad | null> {
  const adRef = doc(db, "ads", id);
  const adSnap = await getDoc(adRef);

  if (!adSnap.exists()) {
    return null;
  }

  return mapDocToAd(adSnap.id, adSnap.data() as Record<string, unknown>);
}

/**
 * Verilen orijinal ilanın update_pending veya needs_revision kopyasını döner.
 * Kopyada admin notları (revisionFields) saklanır.
 */
export async function getPendingCopyForAd(sourceAdId: string): Promise<Ad | null> {
  const snap = await getDocs(
    query(collection(db, "ads"), where("sourceListingId", "==", sourceAdId)),
  );
  const pendingDoc = snap.docs.find((d) => {
    const s = d.data().status as string;
    return s === "update_pending" || s === "needs_revision" || s === "revision_resubmitted";
  });
  if (!pendingDoc) return null;
  return mapDocToAd(pendingDoc.id, pendingDoc.data() as Record<string, unknown>);
}

export async function getAdDocs(filters: AdFilters = {}): Promise<AdPageResult> {
  const pageSize = filters.pageSize ?? 20;
  const constraints: QueryConstraint[] = [where("status", "==", "published")];

  if (filters.city) {
    constraints.push(where("city", "==", filters.city));
  }

  if (filters.category) {
    constraints.push(where("category", "==", filters.category));
  }

  constraints.push(orderBy("createdAt", "desc"), limit(pageSize));

  if (filters.lastDoc) {
    constraints.push(startAfter(filters.lastDoc));
  }

  const q = query(collection(db, "ads"), ...constraints);
  const snapshot = await getDocs(q);

  return {
    ads: snapshot.docs.map((item) =>
      mapDocToAd(item.id, item.data() as Record<string, unknown>),
    ),
    lastDoc: snapshot.docs.at(-1) ?? null,
    hasMore: snapshot.docs.length === pageSize,
  };
}
