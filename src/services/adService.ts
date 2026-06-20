import type { Ad } from "@/types/ad";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  createAdDoc,
  getAdDocById,
  getAdDocs,
  type AdCursor,
  type AdPageResult,
} from "@/lib/firestore/ads";
import { db, isFirebaseClientConfigured } from "@/lib/firebase";
import { mockAds } from "@/lib/mocks/ads";

import type { AdBrowseParams } from "@/types/adBrowse";

export type GetAdsParams = AdBrowseParams & {
  /** Mock modda sayfalama için (Firebase cursor yerine). */
  offset?: number;
};

function applyMockServerFilters(ads: Ad[], params: GetAdsParams): Ad[] {
  let result = ads.filter((item) => item.status === "published" || !item.status);

  if (params.city) {
    result = result.filter((item) => item.city === params.city);
  } else if (params.cities?.length) {
    result = result.filter((item) => params.cities!.includes(item.city));
  }

  if (params.category) {
    result = result.filter((item) => item.category === params.category);
  } else if (params.categories?.length) {
    result = result.filter((item) => params.categories!.includes(item.category));
  }

  if (params.brand) {
    result = result.filter((item) => item.brand === params.brand);
  } else if (params.brands?.length) {
    result = result.filter((item) => item.brand && params.brands!.includes(item.brand));
  }

  return result.sort((a, b) => b.createdAt - a.createdAt);
}

export async function createAd(data: Omit<Ad, "id" | "createdAt">) {
  if (!isFirebaseClientConfigured) {
    throw new Error("Firebase tasarim modunda devre disi. Ilan eklemek icin .env.local tanimlayin.");
  }

  return createAdDoc(data);
}

export async function getAdsPage(params: GetAdsParams = {}): Promise<AdPageResult> {
  const pageSize = params.pageSize ?? 20;

  if (!isFirebaseClientConfigured) {
    const filteredAds = applyMockServerFilters(mockAds, params);
    const offset = params.offset ?? 0;
    const page = filteredAds.slice(offset, offset + pageSize);

    return {
      ads: page,
      lastDoc: null,
      hasMore: offset + pageSize < filteredAds.length,
    };
  }

  return getAdDocs({
    ...params,
    pageSize,
    lastDoc: params.lastDoc ?? null,
  });
}

export async function getAds(params: Omit<GetAdsParams, "lastDoc"> = {}): Promise<Ad[]> {
  const { ads } = await getAdsPage(params);
  return ads;
}

export async function getRelatedAds(adId: string, category: string, limit = 4): Promise<Ad[]> {
  const normalizedCategory = category.trim();

  const { ads } = await getAdsPage({
    category: normalizedCategory || undefined,
    pageSize: limit + 8,
  });

  const sameCategory = ads.filter((item) => item.id !== adId);
  if (sameCategory.length > 0) {
    return sameCategory.slice(0, limit);
  }

  if (!normalizedCategory) return [];

  const { ads: allAds } = await getAdsPage({ pageSize: limit + 8 });
  return allAds.filter((item) => item.id !== adId).slice(0, limit);
}

export async function getAdById(id: string) {
  if (!isFirebaseClientConfigured) {
    return mockAds.find((item) => item.id === id) ?? null;
  }

  return getAdDocById(id);
}

/** Patch ile orijinal arasında hangi alanların değiştiğini hesaplar. */
function computeChangedFields(
  original: Record<string, unknown>,
  patch: Record<string, unknown>,
): string[] {
  return Object.entries(patch)
    .filter(([key, newVal]) => {
      if (newVal === undefined) return false;
      const oldVal = original[key];
      if (Array.isArray(newVal) && Array.isArray(oldVal)) {
        return JSON.stringify(newVal) !== JSON.stringify(oldVal);
      }
      return String(newVal ?? "") !== String(oldVal ?? "");
    })
    .map(([key]) => key);
}

export async function submitAdUpdateForReview(
  sourceAdId: string,
  patch: Pick<
    Ad,
    | "title"
    | "brand"
    | "model"
    | "price"
    | "currency"
    | "city"
    | "district"
    | "neighborhood"
    | "category"
    | "condition"
    | "year"
    | "axisCount"
    | "sellerType"
    | "trade"
    | "delivery"
    | "description"
    | "userName"
  > & {
    images?: string[];
    imagePaths?: string[];
    video?: string;
    videoPath?: string;
  },
) {
  if (!isFirebaseClientConfigured) {
    throw new Error("Firebase tasarim modunda devre disi. Guncelleme icin .env.local tanimlayin.");
  }

  const source = await getAdDocById(sourceAdId);
  if (!source) {
    throw new Error("Kaynak ilan bulunamadi.");
  }

  // Henüz yayınlanmamış (pending / draft) ilanı düzenleme: kopya oluşturma, doğrudan güncelle.
  // Yayına girmeden admin incelemesi sırasında yapılan düzenleme sadece aynı dokümanı günceller.
  if (source.status === "pending" || source.status === "draft") {
    const selfRef = doc(db, "ads", sourceAdId);
    await updateDoc(selfRef, {
      ...patch,
      status: source.status, // pending / draft statüsünü koru
      updatedAt: serverTimestamp(),
    });
    return selfRef;
  }

  // Eğer düzenlenen ilan zaten bir güncelleme kopyasıysa (update_pending / needs_revision),
  // onu doğrudan güncelle — yeni kopya oluşturma.
  if (source.status === "update_pending" || source.status === "needs_revision" || source.status === "revision_resubmitted") {
    const selfRef = doc(db, "ads", sourceAdId);
    const newStatus = source.status === "needs_revision" ? "revision_resubmitted" : source.status;
    const changed = computeChangedFields(source as unknown as Record<string, unknown>, patch as Record<string, unknown>);
    await updateDoc(selfRef, {
      ...patch,
      status: newStatus,
      updatedAt: serverTimestamp(),
      revisionNote: "",
      revisionFields: {},
      changedFields: changed,
    });
    return selfRef;
  }

  const {
    id: _id,
    createdAt: _createdAt,
    publishedAt: _publishedAt,
    deletedAt: _deletedAt,
    status: _status,
    ...carry
  } = source;

  // Orijinal ilanın mevcut bir güncelleme kopyası var mı kontrol et.
  // sourceListingId tek alan filtresiyle arama yapıyoruz (composite index gerekmez).
  const existingUpdateSnap = await getDocs(
    query(collection(db, "ads"), where("sourceListingId", "==", sourceAdId)),
  );
  const existingPending = existingUpdateSnap.docs.find((docSnap) => {
    const s = docSnap.data().status;
    return s === "update_pending" || s === "needs_revision" || s === "revision_resubmitted";
  });

  if (existingPending) {
    const existingStatus = existingPending.data().status as string;
    const newStatus = existingStatus === "needs_revision" ? "revision_resubmitted" : "update_pending";
    const changed = computeChangedFields(carry as Record<string, unknown>, patch as Record<string, unknown>);
    await updateDoc(existingPending.ref, {
      ...carry,
      ...patch,
      status: newStatus,
      sourceListingId: sourceAdId,
      updatedAt: serverTimestamp(),
      revisionNote: "",
      revisionFields: {},
      changedFields: changed,
    });
    return existingPending.ref;
  }

  const changedOnCreate = computeChangedFields(carry as Record<string, unknown>, patch as Record<string, unknown>);
  return createAdDoc({
    ...carry,
    ...patch,
    status: "update_pending",
    sourceListingId: sourceAdId,
    revisionNote: "",
    revisionFields: {},
    changedFields: changedOnCreate,
  });
}
