import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { pickPrimarySearchToken } from "@/lib/utils/searchTokens";

const CLIENT_SCAN_BATCH = 200;
const MAX_RESULTS = 500;

type ClientSearchOptions<T> = {
  collectionName: string;
  query: string;
  mapDoc: (id: string, data: Record<string, unknown>) => T;
  matchesQuery: (item: T, query: string) => boolean;
  passesFilters?: (item: T) => boolean;
  sortBy?: (a: T, b: T) => number;
};

export async function searchPublishedCollectionClient<T>({
  collectionName,
  query: searchQuery,
  mapDoc,
  matchesQuery,
  passesFilters = () => true,
  sortBy,
}: ClientSearchOptions<T>): Promise<T[]> {
  const trimmed = searchQuery.trim();
  if (!trimmed) return [];

  const primaryToken = pickPrimarySearchToken(trimmed);
  const matched = new Map<string, T>();

  const collect = (items: T[]) => {
    for (const item of items) {
      if (!passesFilters(item)) continue;
      if (!matchesQuery(item, trimmed)) continue;
      matched.set((item as { id: string }).id, item);
      if (matched.size >= MAX_RESULTS) return;
    }
  };

  if (primaryToken) {
    try {
      const tokenSnap = await getDocs(
        query(
          collection(db, collectionName),
          where("status", "==", "published"),
          where("searchTokens", "array-contains", primaryToken),
          orderBy("createdAt", "desc"),
          limit(MAX_RESULTS),
        ),
      );
      collect(tokenSnap.docs.map((doc) => mapDoc(doc.id, doc.data() as Record<string, unknown>)));
    } catch {
      /* Index yoksa taramaya devam. */
    }
  }

  if (matched.size >= MAX_RESULTS) {
    const results = [...matched.values()];
    return sortBy ? results.sort(sortBy) : results;
  }

  let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;

  while (matched.size < MAX_RESULTS) {
    const constraints: QueryConstraint[] = [
      where("status", "==", "published"),
      orderBy("createdAt", "desc"),
    ];
    if (lastDoc) constraints.push(startAfter(lastDoc));
    constraints.push(limit(CLIENT_SCAN_BATCH));

    const snap = await getDocs(query(collection(db, collectionName), ...constraints));
    if (snap.empty) break;

    collect(snap.docs.map((doc) => mapDoc(doc.id, doc.data() as Record<string, unknown>)));

    lastDoc = snap.docs[snap.docs.length - 1] ?? null;
    if (snap.size < CLIENT_SCAN_BATCH) break;
  }

  const results = [...matched.values()];
  return sortBy ? results.sort(sortBy) : results;
}

export async function fetchServerSearch<T>(
  url: string,
  fallback: () => Promise<T[]>,
): Promise<T[]> {
  const tryServerSearch = process.env.NODE_ENV === "production";

  if (tryServerSearch) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const payload = (await response.json()) as { items?: T[]; ads?: T[]; jobs?: T[] };
        return payload.items ?? payload.ads ?? payload.jobs ?? [];
      }
    } catch {
      /* API erişilemezse yedek taramaya düş. */
    }
  }

  return fallback();
}
