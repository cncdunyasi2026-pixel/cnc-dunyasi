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

import type { AdBrowseParams } from "@/types/adBrowse";

export type AdCreateInput = Omit<Ad, "id" | "createdAt">;

export function mapDocToAd(id: string, data: Record<string, unknown>): Ad {
  return mapAdSnapshotToAd(id, data);
}

export type AdCursor = QueryDocumentSnapshot<DocumentData> | null;

type AdFilters = AdBrowseParams;

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

  let usedIn = false;

  if (filters.city) {
    constraints.push(where("city", "==", filters.city));
  } else if (filters.cities?.length === 1) {
    constraints.push(where("city", "==", filters.cities[0]));
  } else if (filters.cities && filters.cities.length > 1) {
    constraints.push(where("city", "in", filters.cities.slice(0, 30)));
    usedIn = true;
  }

  if (filters.category) {
    constraints.push(where("category", "==", filters.category));
  } else if (filters.categories?.length === 1) {
    constraints.push(where("category", "==", filters.categories[0]));
  } else if (filters.categories && filters.categories.length > 1 && !usedIn) {
    constraints.push(where("category", "in", filters.categories.slice(0, 30)));
    usedIn = true;
  }

  if (!usedIn) {
    if (filters.brand) {
      constraints.push(where("brand", "==", filters.brand));
    } else if (filters.brands?.length === 1) {
      constraints.push(where("brand", "==", filters.brands[0]));
    } else if (filters.brands && filters.brands.length > 1) {
      constraints.push(where("brand", "in", filters.brands.slice(0, 30)));
    }
  }

  constraints.push(orderBy("createdAt", "desc"));

  if (filters.lastDoc) {
    constraints.push(startAfter(filters.lastDoc));
  }

  constraints.push(limit(pageSize));

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
