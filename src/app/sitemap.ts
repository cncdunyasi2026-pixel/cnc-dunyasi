import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/ilanlar`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/kategori/teknik-servis`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/kategori/yedek-parca`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/kariyer`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/kvkk`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/kullanici-sozlesmesi`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/ilan-ver`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
