import { deleteField, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { fetchWithBrowserCache, removeBrowserCache } from "@/lib/cache/browserCache";
import { CACHE_POLICIES } from "@/lib/cache/policies";
import { getEmptySlotData, getPageContentConfig } from "@/lib/constants/pageContentSlots";
import { db } from "@/lib/firebase";
import type { PageContentSlotData, PageContentSlotId, PageContentSlotsMap } from "@/types/pageContent";
import type { PageHeroId } from "@/types/pageHero";

const COLLECTION = "page_content_slots";

function cacheKey(pageId: PageHeroId): string {
  return `site:page-content:${pageId}`;
}

function normalizeSlot(raw: unknown): PageContentSlotData {
  if (!raw || typeof raw !== "object") return getEmptySlotData();
  const data = raw as Record<string, unknown>;
  const slot: PageContentSlotData = {
    enabled: data.enabled === true,
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : "",
    imagePath: typeof data.imagePath === "string" ? data.imagePath : "",
  };
  if (typeof data.imageWidth === "number") slot.imageWidth = data.imageWidth;
  if (typeof data.imageHeight === "number") slot.imageHeight = data.imageHeight;
  return slot;
}

/** Firestore undefined alan kabul etmez — yalnızca tanımlı değerleri yaz. */
function sanitizeSlotForFirestore(data: PageContentSlotData): Record<string, unknown> {
  const out: Record<string, unknown> = {
    enabled: data.enabled === true,
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : "",
    imagePath: typeof data.imagePath === "string" ? data.imagePath : "",
  };
  if (typeof data.imageWidth === "number") out.imageWidth = data.imageWidth;
  if (typeof data.imageHeight === "number") out.imageHeight = data.imageHeight;
  return out;
}

function sanitizeSlotsForFirestore(
  pageId: PageHeroId,
  slots: PageContentSlotsMap,
): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const slot of getPageContentConfig(pageId).slots) {
    out[slot.id] = sanitizeSlotForFirestore(slots[slot.id] ?? getEmptySlotData());
  }
  return out;
}

function mergeSlots(pageId: PageHeroId, raw: Record<string, unknown> | undefined): PageContentSlotsMap {
  const config = getPageContentConfig(pageId);
  const merged: PageContentSlotsMap = {};

  for (const slot of config.slots) {
    merged[slot.id] = normalizeSlot(raw?.[slot.id]);
  }

  return merged;
}

function mergeDraftSlots(
  pageId: PageHeroId,
  raw: Record<string, unknown> | undefined,
  published: PageContentSlotsMap,
): PageContentSlotsMap {
  const config = getPageContentConfig(pageId);
  const draftRaw =
    raw?.draftSlots && typeof raw.draftSlots === "object"
      ? (raw.draftSlots as Record<string, unknown>)
      : undefined;
  const draft: PageContentSlotsMap = {};

  for (const slot of config.slots) {
    draft[slot.id] = draftRaw?.[slot.id]
      ? normalizeSlot(draftRaw[slot.id])
      : (published[slot.id] ?? getEmptySlotData());
  }

  return draft;
}

export function slotsEqual(
  pageId: PageHeroId,
  a: PageContentSlotsMap,
  b: PageContentSlotsMap,
): boolean {
  for (const slot of getPageContentConfig(pageId).slots) {
    const left = a[slot.id] ?? getEmptySlotData();
    const right = b[slot.id] ?? getEmptySlotData();
    if (
      left.enabled !== right.enabled ||
      left.imageUrl !== right.imageUrl ||
      left.imagePath !== right.imagePath
    ) {
      return false;
    }
  }
  return true;
}

/** Sitede gösterilen yayındaki içerik */
export async function getPageContentSlots(pageId: PageHeroId): Promise<PageContentSlotsMap> {
  const { data } = await fetchWithBrowserCache(
    cacheKey(pageId),
    CACHE_POLICIES.siteMetadata,
    async () => {
      const snap = await getDoc(doc(db, COLLECTION, pageId));
      return mergeSlots(pageId, snap.exists() ? snap.data() : undefined);
    },
  );
  return data;
}

/** Admin: yayındaki + taslak içerik */
export async function getPageContentAdminState(
  pageId: PageHeroId,
): Promise<{ published: PageContentSlotsMap; draft: PageContentSlotsMap }> {
  const snap = await getDoc(doc(db, COLLECTION, pageId));
  const raw = snap.exists() ? snap.data() : undefined;
  const published = mergeSlots(pageId, raw);
  const draft = mergeDraftSlots(pageId, raw, published);
  return { published, draft };
}

/** Taslak kaydet — siteye yansımaz */
export async function savePageContentDraft(
  pageId: PageHeroId,
  draft: PageContentSlotsMap,
): Promise<void> {
  await setDoc(
    doc(db, COLLECTION, pageId),
    {
      draftSlots: sanitizeSlotsForFirestore(pageId, draft),
      draftUpdatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Taslağı yayına al */
export async function publishPageContent(
  pageId: PageHeroId,
  draft: PageContentSlotsMap,
): Promise<void> {
  const payload: Record<string, unknown> = {
    draftSlots: deleteField(),
    draftUpdatedAt: deleteField(),
    updatedAt: serverTimestamp(),
    publishedAt: serverTimestamp(),
  };

  for (const slot of getPageContentConfig(pageId).slots) {
    payload[slot.id] = sanitizeSlotForFirestore(draft[slot.id] ?? getEmptySlotData());
  }

  await setDoc(doc(db, COLLECTION, pageId), payload, { merge: true });
  removeBrowserCache(cacheKey(pageId));
}

/** @deprecated Tek slot yayın — publishPageContent kullanın */
export async function savePageContentSlot(
  pageId: PageHeroId,
  slotId: PageContentSlotId,
  data: PageContentSlotData,
): Promise<void> {
  await setDoc(
    doc(db, COLLECTION, pageId),
    {
      [slotId]: sanitizeSlotForFirestore(data),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  removeBrowserCache(cacheKey(pageId));
}
