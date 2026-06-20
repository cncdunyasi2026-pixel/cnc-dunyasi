import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db, isFirebaseClientConfigured } from "@/lib/firebase";
import type { MarketplaceListingRecord } from "@/types/marketplaceListing";
import type { MarketplaceProfile } from "@/types/marketplace";
import { mapMarketplaceDocToProfile } from "@/lib/firestore/mapMarketplaceDoc";

const BROWSE_PAGE_SIZE = 60;

export async function createTechnicalServiceListingDoc(data: MarketplaceListingRecord) {
  return addDoc(collection(db, "technical_service_listings"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function createSparePartListingDoc(data: MarketplaceListingRecord) {
  return addDoc(collection(db, "spare_part_listings"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getPublishedTechnicalProfiles(pageSize = BROWSE_PAGE_SIZE): Promise<MarketplaceProfile[]> {
  const q = query(
    collection(db, "technical_service_listings"),
    where("status", "==", "published"),
    orderBy("createdAt", "desc"),
    limit(pageSize),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapMarketplaceDocToProfile(d.id, d.data() as Record<string, unknown>));
}

export async function getPublishedSparePartProfiles(pageSize = BROWSE_PAGE_SIZE): Promise<MarketplaceProfile[]> {
  const q = query(
    collection(db, "spare_part_listings"),
    where("status", "==", "published"),
    orderBy("createdAt", "desc"),
    limit(pageSize),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapMarketplaceDocToProfile(d.id, d.data() as Record<string, unknown>));
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
