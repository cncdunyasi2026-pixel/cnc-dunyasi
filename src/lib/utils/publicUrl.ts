import { BRAND_DOMAIN } from "@/lib/constants/brand";

/** Paylaşılan ilan / mesaj linkleri için kanonik site kökü */
export const PUBLIC_SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_URL ?? `https://${BRAND_DOMAIN}`
).replace(/\/$/, "");

export function buildPublicUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${PUBLIC_SITE_ORIGIN}${normalized}`;
}

/** Kayıtlı mutlak URL veya path'i uygulama içi route'a çevirir. */
export function listingUrlToPath(urlOrPath: string | null | undefined): string {
  if (!urlOrPath?.trim()) return "#";
  const value = urlOrPath.trim();
  if (value.startsWith("/")) return value;
  try {
    const parsed = new URL(value);
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return value.startsWith("/") ? value : `/${value}`;
  }
}
