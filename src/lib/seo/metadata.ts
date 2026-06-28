import type { Metadata } from "next";
import { BRAND_DOMAIN, BRAND_NAME } from "@/lib/constants/brand";

export const SITE_URL = `https://${BRAND_DOMAIN}`;

export const DEFAULT_DESCRIPTION =
  "İkinci el CNC tezgah ilanları, teknik servis, yedek parça ve kariyer fırsatları. Türkiye'nin CNC sektörü platformu.";

type PageMetadataOptions = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  image?: string;
  /** true ise sekme başlığında marka şablonu kullanılmaz (örn. sadece ilan adı). */
  absoluteTitle?: boolean;
};

export function createPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  noIndex = false,
  image,
  absoluteTitle = false,
}: PageMetadataOptions): Metadata {
  const url = path ? `${SITE_URL}${path}` : SITE_URL;
  const displayTitle = absoluteTitle ? title : `${title} | ${BRAND_NAME}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: displayTitle,
      description,
      url,
      siteName: BRAND_NAME,
      locale: "tr_TR",
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: displayTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
    alternates: {
      canonical: url,
    },
  };
}

export function truncateDescription(text: string, maxLength = 160): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}
