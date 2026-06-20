import "server-only";

import type { DocumentSnapshot, Query } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { pickPrimarySearchToken } from "@/lib/utils/searchTokens";

const SCAN_BATCH_SIZE = 400;
const MAX_RESULTS = 500;

type SearchCollectionOptions<T> = {
  collectionName: string;
  query: string;
  mapDoc: (id: string, data: Record<string, unknown>) => T;
  matchesQuery: (item: T, query: string) => boolean;
  passesFilters?: (item: T) => boolean;
  sortBy?: (a: T, b: T) => number;
};

async function scanPublished<T>(
  collectionName: string,
  onBatch: (items: T[]) => void,
  mapDoc: (id: string, data: Record<string, unknown>) => T,
  passesFilters: (item: T) => boolean,
): Promise<void> {
  if (!adminDb) return;

  let lastDoc: DocumentSnapshot | null = null;

  while (true) {
    let q: Query = adminDb
      .collection(collectionName)
      .where("status", "==", "published")
      .orderBy("createdAt", "desc")
      .limit(SCAN_BATCH_SIZE);

    if (lastDoc) {
      q = q.startAfter(lastDoc);
    }

    const snap = await q.get();
    if (snap.empty) break;

    onBatch(
      snap.docs
        .map((doc) => mapDoc(doc.id, doc.data() as Record<string, unknown>))
        .filter(passesFilters),
    );

    lastDoc = snap.docs[snap.docs.length - 1] ?? null;
    if (snap.size < SCAN_BATCH_SIZE) break;
  }
}

async function queryByToken<T>(
  collectionName: string,
  token: string,
  mapDoc: (id: string, data: Record<string, unknown>) => T,
  passesFilters: (item: T) => boolean,
): Promise<T[]> {
  if (!adminDb) return [];

  const snap = await adminDb
    .collection(collectionName)
    .where("status", "==", "published")
    .where("searchTokens", "array-contains", token)
    .orderBy("createdAt", "desc")
    .limit(MAX_RESULTS)
    .get();

  return snap.docs
    .map((doc) => mapDoc(doc.id, doc.data() as Record<string, unknown>))
    .filter(passesFilters);
}

export async function searchPublishedCollection<T>({
  collectionName,
  query,
  mapDoc,
  matchesQuery,
  passesFilters = () => true,
  sortBy,
}: SearchCollectionOptions<T>): Promise<T[]> {
  if (!adminDb) {
    throw new Error("Sunucu araması yapılandırılmamış.");
  }

  const trimmed = query.trim();
  if (!trimmed) return [];

  const primaryToken = pickPrimarySearchToken(trimmed);
  const matched = new Map<string, T>();

  const collect = (items: T[]) => {
    for (const item of items) {
      if (!matchesQuery(item, trimmed)) continue;
      const id = (item as { id: string }).id;
      matched.set(id, item);
      if (matched.size >= MAX_RESULTS) return;
    }
  };

  if (primaryToken) {
    try {
      collect(await queryByToken(collectionName, primaryToken, mapDoc, passesFilters));
    } catch {
      /* Index yoksa tam taramaya düş. */
    }
  }

  if (matched.size < MAX_RESULTS) {
    await scanPublished(collectionName, (batch) => {
      if (matched.size >= MAX_RESULTS) return;
      collect(batch);
    }, mapDoc, passesFilters);
  }

  const results = [...matched.values()];
  if (sortBy) {
    results.sort(sortBy);
  }
  return results;
}
