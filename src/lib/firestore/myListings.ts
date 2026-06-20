import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { coerceFirestoreMillis } from "@/lib/firestore/coerceFirestoreMillis";
import { mapAdSnapshotToAd } from "@/lib/firestore/mapAdDoc";
import type { Ad } from "@/types/ad";
import type { ListingLifecycleStatus } from "@/types/listingStatus";
import type { MyJobListingRow, MyMarketplaceListingRow } from "@/types/myListings";

const OWNER_PAGE_SIZE = 50;

function revisionNoteFrom(data: Record<string, unknown>): string | undefined {
  const r = data.revisionNote;
  return typeof r === "string" && r.trim() ? r.trim() : undefined;
}

function revisionFieldsFrom(data: Record<string, unknown>): Record<string, string> | undefined {
  const raw = data.revisionFields;
  if (!raw || typeof raw !== "object") return undefined;
  const mapped = Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).filter(
      ([, value]) => typeof value === "string" && value.trim().length > 0,
    ),
  );
  return Object.keys(mapped).length > 0 ? (mapped as Record<string, string>) : undefined;
}

function mapMarketplaceDoc(
  id: string,
  data: Record<string, unknown>,
  kind: MyMarketplaceListingRow["kind"],
): MyMarketplaceListingRow {
  const status = (data.status as ListingLifecycleStatus) ?? "pending";
  const imageUrl = Array.isArray(data.images) && typeof data.images[0] === "string"
    ? data.images[0]
    : undefined;
  return {
    id,
    kind,
    slug: String(data.slug ?? ""),
    title: String(data.title ?? ""),
    name: String(data.name ?? ""),
    city: String(data.city ?? ""),
    imageUrl,
    status,
    createdAt: coerceFirestoreMillis(data.createdAt),
    revisionNote: revisionNoteFrom(data),
    revisionFields: revisionFieldsFrom(data),
  };
}

function mapJobDoc(id: string, data: Record<string, unknown>): MyJobListingRow {
  const status = (data.status as ListingLifecycleStatus) ?? "pending";
  const imageUrl = Array.isArray(data.images) && typeof data.images[0] === "string"
    ? data.images[0]
    : undefined;
  return {
    id,
    slug: String(data.slug ?? ""),
    title: String(data.title ?? ""),
    company: String(data.company ?? ""),
    imageUrl,
    status,
    createdAt: coerceFirestoreMillis(data.createdAt),
    revisionNote: revisionNoteFrom(data),
    revisionFields: revisionFieldsFrom(data),
  };
}

async function mergeAdsByOwner(ownerId: string): Promise<Ad[]> {
  const qOwner = query(
    collection(db, "ads"),
    where("ownerId", "==", ownerId),
    orderBy("createdAt", "desc"),
    limit(OWNER_PAGE_SIZE),
  );
  const qLegacy = query(
    collection(db, "ads"),
    where("userId", "==", ownerId),
    orderBy("createdAt", "desc"),
    limit(OWNER_PAGE_SIZE),
  );
  const settled = await Promise.allSettled([getDocs(qOwner), getDocs(qLegacy)]);
  const byId = new Map<string, Ad>();
  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    for (const d of r.value.docs) {
      byId.set(d.id, mapAdSnapshotToAd(d.id, d.data() as Record<string, unknown>));
    }
  }
  const allAds = [...byId.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, OWNER_PAGE_SIZE);

  // Orijinal ilanların güncelleme kopyaları (sourceListingId'ye sahip update_pending /
  // needs_revision / revision_resubmitted) ayrı kart olarak gösterilmez;
  // durumları orijinal ilanın kartına aktarılır.
  const pendingCopyBySourceId = new Map<string, Ad>();
  for (const ad of allAds) {
    if (
      ad.sourceListingId &&
      (ad.status === "update_pending" ||
        ad.status === "needs_revision" ||
        ad.status === "revision_resubmitted")
    ) {
      pendingCopyBySourceId.set(ad.sourceListingId, ad);
    }
  }

  return allAds
    .filter((ad) => !ad.sourceListingId) // Sadece orijinal ilanları göster
    .map((ad) => {
      const copy = pendingCopyBySourceId.get(ad.id);
      if (!copy) return ad;
      // Orijinal ilanın kartında kopyanın durumunu ve revizyon notlarını göster
      return {
        ...ad,
        status: copy.status,
        revisionNote: copy.revisionNote,
        revisionFields: copy.revisionFields,
      };
    });
}

async function mergeMarketplaceByOwner(
  collectionName: "technical_service_listings" | "spare_part_listings",
  ownerId: string,
  kind: MyMarketplaceListingRow["kind"],
): Promise<MyMarketplaceListingRow[]> {
  const qOwner = query(
    collection(db, collectionName),
    where("ownerId", "==", ownerId),
    orderBy("createdAt", "desc"),
    limit(OWNER_PAGE_SIZE),
  );
  const qLegacy = query(
    collection(db, collectionName),
    where("userId", "==", ownerId),
    orderBy("createdAt", "desc"),
    limit(OWNER_PAGE_SIZE),
  );
  const settled = await Promise.allSettled([getDocs(qOwner), getDocs(qLegacy)]);
  const byId = new Map<string, MyMarketplaceListingRow>();
  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    for (const d of r.value.docs) {
      byId.set(d.id, mapMarketplaceDoc(d.id, d.data() as Record<string, unknown>, kind));
    }
  }
  return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, OWNER_PAGE_SIZE);
}

async function mergeJobsByOwner(ownerId: string): Promise<MyJobListingRow[]> {
  const qOwner = query(
    collection(db, "job_listings"),
    where("ownerId", "==", ownerId),
    orderBy("createdAt", "desc"),
    limit(OWNER_PAGE_SIZE),
  );
  const qLegacy = query(
    collection(db, "job_listings"),
    where("userId", "==", ownerId),
    orderBy("createdAt", "desc"),
    limit(OWNER_PAGE_SIZE),
  );
  const settled = await Promise.allSettled([getDocs(qOwner), getDocs(qLegacy)]);
  const byId = new Map<string, MyJobListingRow>();
  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    for (const d of r.value.docs) {
      byId.set(d.id, mapJobDoc(d.id, d.data() as Record<string, unknown>));
    }
  }
  return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, OWNER_PAGE_SIZE);
}

export async function fetchAdsByOwner(ownerId: string): Promise<Ad[]> {
  return mergeAdsByOwner(ownerId);
}

export async function fetchTechnicalServiceByOwner(ownerId: string): Promise<MyMarketplaceListingRow[]> {
  return mergeMarketplaceByOwner("technical_service_listings", ownerId, "technical");
}

export async function fetchSparePartByOwner(ownerId: string): Promise<MyMarketplaceListingRow[]> {
  return mergeMarketplaceByOwner("spare_part_listings", ownerId, "spare");
}

export async function fetchJobsByOwner(ownerId: string): Promise<MyJobListingRow[]> {
  return mergeJobsByOwner(ownerId);
}
