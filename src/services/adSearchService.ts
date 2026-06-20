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
import { db, isFirebaseClientConfigured } from "@/lib/firebase";
import { mapDocToAd } from "@/lib/firestore/ads";
import type { Ad } from "@/types/ad";
import type { AdServerFilters } from "@/types/adBrowse";
import { mockAds } from "@/lib/mocks/ads";
import {
  adMatchesSearchQuery,
  passesAdServerFilters,
  pickPrimarySearchToken,
} from "@/lib/utils/adSearch";

const CLIENT_SCAN_BATCH = 200;
const MAX_RESULTS = 500;

export type SearchAdsParams = AdServerFilters & {
  query: string;
};

function buildSearchUrl(params: SearchAdsParams): string {
  const url = new URL("/api/ads/search", window.location.origin);
  url.searchParams.set("q", params.query.trim());

  if (params.city) url.searchParams.set("city", params.city);
  if (params.cities?.length) url.searchParams.set("cities", params.cities.join(","));
  if (params.category) url.searchParams.set("category", params.category);
  if (params.categories?.length) url.searchParams.set("categories", params.categories.join(","));
  if (params.brand) url.searchParams.set("brand", params.brand);
  if (params.brands?.length) url.searchParams.set("brands", params.brands.join(","));

  return url.toString();
}

async function searchAdsViaClientScan(params: SearchAdsParams): Promise<Ad[]> {
  const trimmed = params.query.trim();
  if (!trimmed) return [];

  const primaryToken = pickPrimarySearchToken(trimmed);
  const matched = new Map<string, Ad>();

  const collect = (ads: Ad[]) => {
    for (const ad of ads) {
      if (!passesAdServerFilters(ad, params)) continue;
      if (!adMatchesSearchQuery(ad, trimmed)) continue;
      matched.set(ad.id, ad);
      if (matched.size >= MAX_RESULTS) return;
    }
  };

  if (primaryToken) {
    try {
      const tokenSnap = await getDocs(
        query(
          collection(db, "ads"),
          where("status", "==", "published"),
          where("searchTokens", "array-contains", primaryToken),
          orderBy("createdAt", "desc"),
          limit(MAX_RESULTS),
        ),
      );
      collect(
        tokenSnap.docs.map((doc) =>
          mapDocToAd(doc.id, doc.data() as Record<string, unknown>),
        ),
      );
    } catch {
      /* Index yoksa taramaya devam. */
    }
  }

  if (matched.size >= MAX_RESULTS) {
    return [...matched.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;

  while (matched.size < MAX_RESULTS) {
    const constraints: QueryConstraint[] = [
      where("status", "==", "published"),
      orderBy("createdAt", "desc"),
    ];
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    constraints.push(limit(CLIENT_SCAN_BATCH));

    const snap = await getDocs(query(collection(db, "ads"), ...constraints));
    if (snap.empty) break;

    collect(
      snap.docs.map((doc) => mapDocToAd(doc.id, doc.data() as Record<string, unknown>)),
    );

    lastDoc = snap.docs[snap.docs.length - 1] ?? null;
    if (snap.size < CLIENT_SCAN_BATCH) break;
  }

  return [...matched.values()].sort((a, b) => b.createdAt - a.createdAt);
}

function searchMockAds(params: SearchAdsParams): Ad[] {
  const trimmed = params.query.trim();
  if (!trimmed) return [];

  return mockAds
    .filter((ad) => ad.status === "published" || !ad.status)
    .filter((ad) => passesAdServerFilters(ad, params))
    .filter((ad) => adMatchesSearchQuery(ad, trimmed))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_RESULTS);
}

export async function searchAds(params: SearchAdsParams): Promise<Ad[]> {
  const trimmed = params.query.trim();
  if (!trimmed) return [];

  if (!isFirebaseClientConfigured) {
    return searchMockAds(params);
  }

  // Lokal gelistirmede admin genelde yok; API 500/503 konsol gürültüsü + ek gecikme yaratmasın.
  const tryServerSearch = process.env.NODE_ENV === "production";

  if (tryServerSearch) {
    try {
      const response = await fetch(buildSearchUrl(params));
      if (response.ok) {
        const payload = (await response.json()) as { ads?: Ad[] };
        return payload.ads ?? [];
      }
    } catch {
      /* API erişilemezse istemci taramasına düş. */
    }
  }

  return searchAdsViaClientScan(params);
}
