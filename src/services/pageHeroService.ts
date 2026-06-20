import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { fetchWithBrowserCache, removeBrowserCache } from "@/lib/cache/browserCache";
import { CACHE_POLICIES } from "@/lib/cache/policies";
import { getPageHeroDefinition } from "@/lib/constants/pageHeroPages";
import { db } from "@/lib/firebase";
import type { PageHeroContent, PageHeroId } from "@/types/pageHero";

const COLLECTION = "page_heroes";

function cacheKey(pageId: PageHeroId): string {
  return `site:page-hero:${pageId}`;
}

function mergeWithDefaults(pageId: PageHeroId, raw: Record<string, unknown> | undefined): PageHeroContent {
  const defaults = getPageHeroDefinition(pageId).defaults;
  if (!raw) return defaults;

  return {
    eyebrow: typeof raw.eyebrow === "string" && raw.eyebrow.trim() ? raw.eyebrow : defaults.eyebrow,
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title : defaults.title,
    description:
      typeof raw.description === "string" && raw.description.trim() ? raw.description : defaults.description,
    eyebrowColor:
      typeof raw.eyebrowColor === "string" && raw.eyebrowColor.trim()
        ? raw.eyebrowColor
        : defaults.eyebrowColor,
    titleColor:
      typeof raw.titleColor === "string" && raw.titleColor.trim() ? raw.titleColor : defaults.titleColor,
    descriptionColor:
      typeof raw.descriptionColor === "string" && raw.descriptionColor.trim()
        ? raw.descriptionColor
        : defaults.descriptionColor,
  };
}

export async function getPageHeroContent(pageId: PageHeroId): Promise<PageHeroContent> {
  const { data } = await fetchWithBrowserCache(
    cacheKey(pageId),
    CACHE_POLICIES.siteMetadata,
    async () => {
      const snap = await getDoc(doc(db, COLLECTION, pageId));
      return mergeWithDefaults(pageId, snap.exists() ? snap.data() : undefined);
    },
  );
  return data;
}

export async function savePageHeroContent(pageId: PageHeroId, content: PageHeroContent): Promise<void> {
  await setDoc(
    doc(db, COLLECTION, pageId),
    {
      ...content,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  removeBrowserCache(cacheKey(pageId));
}
