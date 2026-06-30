import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { fetchWithBrowserCache, removeBrowserCache } from "@/lib/cache/browserCache";
import { CACHE_POLICIES } from "@/lib/cache/policies";
import { DEFAULT_FOOTER_SETTINGS, FOOTER_DOC_ID } from "@/lib/constants/footerDefaults";
import { db } from "@/lib/firebase";
import type { FooterLegalDocument, FooterLink, FooterSettings } from "@/types/footer";

const COLLECTION = "site_footer";
const CACHE_KEY = "site:footer:main";

function parseLink(value: unknown, fallback: FooterLink): FooterLink {
  if (!value || typeof value !== "object") return fallback;
  const raw = value as Record<string, unknown>;
  return {
    label: typeof raw.label === "string" && raw.label.trim() ? raw.label.trim() : fallback.label,
    href: typeof raw.href === "string" && raw.href.trim() ? raw.href.trim() : fallback.href,
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : fallback.enabled,
  };
}

function parseLinks(value: unknown, fallback: FooterLink[]): FooterLink[] {
  if (!Array.isArray(value)) return fallback;
  return value.map((item, index) => parseLink(item, fallback[index] ?? fallback[fallback.length - 1]));
}

function parseLegal(value: unknown, fallback: FooterLegalDocument): FooterLegalDocument {
  if (!value || typeof value !== "object") return fallback;
  const raw = value as Record<string, unknown>;
  return {
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : fallback.title,
    body: typeof raw.body === "string" ? raw.body : fallback.body,
  };
}

function mergeWithDefaults(raw: Record<string, unknown> | undefined): FooterSettings {
  if (!raw) return DEFAULT_FOOTER_SETTINGS;

  return {
    tagline:
      typeof raw.tagline === "string" && raw.tagline.trim()
        ? raw.tagline.trim()
        : DEFAULT_FOOTER_SETTINGS.tagline,
    contactEmail:
      typeof raw.contactEmail === "string" && raw.contactEmail.trim()
        ? raw.contactEmail.trim()
        : DEFAULT_FOOTER_SETTINGS.contactEmail,
    contactNote:
      typeof raw.contactNote === "string" && raw.contactNote.trim()
        ? raw.contactNote.trim()
        : DEFAULT_FOOTER_SETTINGS.contactNote,
    instagramUrl: typeof raw.instagramUrl === "string" ? raw.instagramUrl.trim() : "",
    linkedinUrl: typeof raw.linkedinUrl === "string" ? raw.linkedinUrl.trim() : "",
    platformLinks: parseLinks(raw.platformLinks, DEFAULT_FOOTER_SETTINGS.platformLinks),
    accountLinks: parseLinks(raw.accountLinks, DEFAULT_FOOTER_SETTINGS.accountLinks),
    corporateLinks: parseLinks(raw.corporateLinks, DEFAULT_FOOTER_SETTINGS.corporateLinks),
    bottomLinks: parseLinks(raw.bottomLinks, DEFAULT_FOOTER_SETTINGS.bottomLinks),
    kvkk: parseLegal(raw.kvkk, DEFAULT_FOOTER_SETTINGS.kvkk),
    userAgreement: parseLegal(raw.userAgreement, DEFAULT_FOOTER_SETTINGS.userAgreement),
  };
}

export async function getFooterSettings(): Promise<FooterSettings> {
  const { data } = await fetchWithBrowserCache(
    CACHE_KEY,
    CACHE_POLICIES.siteMetadata,
    async () => {
      const snap = await getDoc(doc(db, COLLECTION, FOOTER_DOC_ID));
      return mergeWithDefaults(snap.exists() ? snap.data() : undefined);
    },
  );
  return data;
}

export async function saveFooterSettings(settings: FooterSettings): Promise<void> {
  await setDoc(
    doc(db, COLLECTION, FOOTER_DOC_ID),
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  removeBrowserCache(CACHE_KEY);
}
