import {
  addDoc,
  collection,
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
import { db, isFirebaseClientConfigured } from "@/lib/firebase";
import type { MarketplaceListingRecord } from "@/types/marketplaceListing";
import type { MarketplaceProfile } from "@/types/marketplace";
import { mapMarketplaceDocToProfile } from "@/lib/firestore/mapMarketplaceDoc";
import { sparePartFirms, technicalServiceProfiles } from "@/lib/mocks/marketplace";
import { buildMarketplaceSearchTokens } from "@/lib/utils/marketplaceSearch";

const BROWSE_PAGE_SIZE = 60;
const DEFAULT_PAGE_SIZE = 24;

export type ListingCursor = QueryDocumentSnapshot<DocumentData> | null;

export type ListingPageResult = {
  items: MarketplaceProfile[];
  lastDoc: ListingCursor;
  hasMore: boolean;
};

async function getPublishedProfilesPage(
  collectionName: "technical_service_listings" | "spare_part_listings",
  pageSize: number,
  lastDoc: ListingCursor,
): Promise<ListingPageResult> {
  const constraints: QueryConstraint[] = [
    where("status", "==", "published"),
    orderBy("createdAt", "desc"),
  ];
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  constraints.push(limit(pageSize));

  const snap = await getDocs(query(collection(db, collectionName), ...constraints));
  const items = snap.docs.map((d) =>
    mapMarketplaceDocToProfile(d.id, d.data() as Record<string, unknown>),
  );
  const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : lastDoc;

  return {
    items,
    lastDoc: newLastDoc,
    hasMore: snap.docs.length === pageSize,
  };
}

export async function getPublishedTechnicalProfilesPage(
  pageSize = DEFAULT_PAGE_SIZE,
  lastDoc: ListingCursor = null,
): Promise<ListingPageResult> {
  return getPublishedProfilesPage("technical_service_listings", pageSize, lastDoc);
}

export async function getPublishedSparePartProfilesPage(
  pageSize = DEFAULT_PAGE_SIZE,
  lastDoc: ListingCursor = null,
): Promise<ListingPageResult> {
  return getPublishedProfilesPage("spare_part_listings", pageSize, lastDoc);
}

export async function createTechnicalServiceListingDoc(data: MarketplaceListingRecord) {
  return addDoc(collection(db, "technical_service_listings"), {
    ...data,
    searchTokens: buildMarketplaceSearchTokens(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function createSparePartListingDoc(data: MarketplaceListingRecord) {
  return addDoc(collection(db, "spare_part_listings"), {
    ...data,
    searchTokens: buildMarketplaceSearchTokens(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getPublishedTechnicalProfiles(pageSize = BROWSE_PAGE_SIZE): Promise<MarketplaceProfile[]> {
  const { items } = await getPublishedTechnicalProfilesPage(pageSize);
  return items;
}

export async function getPublishedSparePartProfiles(pageSize = BROWSE_PAGE_SIZE): Promise<MarketplaceProfile[]> {
  const { items } = await getPublishedSparePartProfilesPage(pageSize);
  return items;
}

async function getMarketplaceListingBySlugClient(
  collectionName: "technical_service_listings" | "spare_part_listings",
  slug: string,
): Promise<MarketplaceProfile | null> {
  if (!isFirebaseClientConfigured) {
    return null;
  }

  const q = query(
    collection(db, collectionName),
    where("slug", "==", slug),
    where("status", "==", "published"),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) {
    return null;
  }

  const d = snap.docs[0];
  return mapMarketplaceDocToProfile(d.id, d.data() as Record<string, unknown>);
}

export async function getTechnicalListingBySlugClient(slug: string): Promise<MarketplaceProfile | null> {
  return getMarketplaceListingBySlugClient("technical_service_listings", slug);
}

export async function getSparePartListingBySlugClient(slug: string): Promise<MarketplaceProfile | null> {
  return getMarketplaceListingBySlugClient("spare_part_listings", slug);
}

export async function getRelatedMarketplaceProfiles(
  variant: "technical" | "spare",
  excludeId: string,
  category: string,
  limit = 4,
): Promise<MarketplaceProfile[]> {
  const normalizedCategory = category.trim();

  if (!isFirebaseClientConfigured) {
    const pool = variant === "technical" ? technicalServiceProfiles : sparePartFirms;
    return pool
      .filter(
        (item) =>
          item.id !== excludeId &&
          (!normalizedCategory || item.category === normalizedCategory),
      )
      .slice(0, limit);
  }

  const fetchPublished =
    variant === "technical" ? getPublishedTechnicalProfiles : getPublishedSparePartProfiles;
  const published = await fetchPublished(Math.max(limit + 8, 20));

  const sameCategory = published.filter(
    (item) =>
      item.id !== excludeId &&
      (!normalizedCategory || item.category === normalizedCategory),
  );

  if (sameCategory.length > 0) {
    return sameCategory.slice(0, limit);
  }

  return published.filter((item) => item.id !== excludeId).slice(0, limit);
}
