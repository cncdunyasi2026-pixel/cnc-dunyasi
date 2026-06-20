import type { PageContentPageConfig, PageContentSlotData, PageContentSlotDefinition } from "@/types/pageContent";
import type { PageHeroId } from "@/types/pageHero";

/** Site içeriği max-w-7xl (1280px) + px-4 → ~1216px görünür alan */
const CONTAINER_WIDTH = 1216;
/** Liste sayfası sağ kolon: 1280 - sidebar(260) - gap(24) - padding(32) ≈ 964px */
const LIST_COLUMN_WIDTH = 964;

const HOME_SLOTS: PageContentSlotDefinition[] = [
  {
    id: "above_weekly_deals",
    label: "Haftanın Fırsatları üstü",
    description: "Hero ile haftanın fırsatları arasında, tam sayfa genişliğinde içerik alanı.",
    recommendedWidth: 1200,
    recommendedHeight: 160,
    displayMaxWidth: CONTAINER_WIDTH,
    displayMode: "fullBleed",
    previewLayout: "home-above-weekly",
    recommendedNote:
      "Yatay promo bandı. Genişlik öncelikli; yükseklik genelde 120–200 px arası kalır. Görsel yüksekliği orijinal oranıyla gösterilir.",
  },
  {
    id: "between_ads_and_services",
    label: "İlanlar — Teknik Servis arası",
    description: "Öne çıkan ilanlar bloğu ile teknik servisler arasında.",
    recommendedWidth: 1200,
    recommendedHeight: 200,
    displayMaxWidth: CONTAINER_WIDTH,
    displayMode: "fullBleed",
    previewLayout: "home-between-sections",
    recommendedNote:
      "İki bölüm arası banner. 1200×180–220 px ideal; daha uzun görseller de orijinal oranında akar.",
  },
  {
    id: "below_jobs",
    label: "İş ilanları altı",
    description: "Öne çıkan iş ilanlarından sonra, alt promo alanından önce.",
    recommendedWidth: 1200,
    recommendedHeight: 160,
    displayMaxWidth: CONTAINER_WIDTH,
    displayMode: "fullBleed",
    previewLayout: "home-below-jobs",
    recommendedNote:
      "Sayfa ortası alt band. 1200×140–180 px önerilir; metin içeren görseller için biraz daha yüksek kullanılabilir.",
  },
];

const LISTING_SLOTS: PageContentSlotDefinition[] = [
  {
    id: "page_top",
    label: "Sayfa en üstü",
    description: "Header bannerından önce, ekranın tam genişliğinde ince şerit alan.",
    recommendedWidth: 1920,
    recommendedHeight: 72,
    displayMaxWidth: 1920,
    displayMode: "fullBleed",
    previewLayout: "listing-top-strip",
    recommendedNote:
      "Tam genişlik üst şerit. 1920×48–96 px ince duyuru bandı; mobilde de kenardan kenara uzanır.",
  },
  {
    id: "below_header",
    label: "Header görseli altı",
    description: "Banner görselinin hemen altında, sayfa içeriği genişliğinde.",
    recommendedWidth: 1200,
    recommendedHeight: 140,
    displayMaxWidth: CONTAINER_WIDTH,
    displayMode: "fullBleed",
    previewLayout: "listing-below-hero",
    recommendedNote:
      "Banner altı promo. 1200×100–160 px; filtre/liste alanından önce dikkat çekici yatay görsel.",
  },
  {
    id: "above_listings",
    label: "İlanlar üstü",
    description: "Arama çubuğu ve ilan listesinin hemen üstünde (sağ kolon genişliği).",
    recommendedWidth: 960,
    recommendedHeight: 120,
    displayMaxWidth: LIST_COLUMN_WIDTH,
    displayMode: "listColumn",
    previewLayout: "listing-above-list",
    recommendedNote:
      `Liste kolonu (~${LIST_COLUMN_WIDTH}px). Sidebar yanındaki dar alana uygun; 960×80–140 px yatay banner.`,
  },
  {
    id: "below_listings",
    label: "İlanlar altı",
    description: "İlan listesi ve “daha fazla yükle” alanının altında (sağ kolon).",
    recommendedWidth: 960,
    recommendedHeight: 120,
    displayMaxWidth: LIST_COLUMN_WIDTH,
    displayMode: "listColumn",
    previewLayout: "listing-below-list",
    recommendedNote:
      `Liste bitiminde, aynı kolon genişliğinde (~${LIST_COLUMN_WIDTH}px). 960×80–140 px.`,
  },
  {
    id: "page_bottom",
    label: "Sayfa en altı",
    description: "Tüm liste ve bilgi alanlarından sonra, sayfanın en altında.",
    recommendedWidth: 1200,
    recommendedHeight: 180,
    displayMaxWidth: CONTAINER_WIDTH,
    displayMode: "fullBleed",
    previewLayout: "listing-bottom",
    recommendedNote:
      "Sayfa altı geniş banner. 1200×140–200 px; kampanya veya marka mesajı için uygun.",
  },
];

export const PAGE_CONTENT_CONFIGS: PageContentPageConfig[] = [
  { pageId: "home", slots: HOME_SLOTS },
  { pageId: "ilanlar", slots: LISTING_SLOTS },
  { pageId: "teknik-servis", slots: LISTING_SLOTS },
  { pageId: "yedek-parca", slots: LISTING_SLOTS },
  { pageId: "kariyer", slots: LISTING_SLOTS },
];

export function getPageContentConfig(pageId: PageHeroId): PageContentPageConfig {
  const found = PAGE_CONTENT_CONFIGS.find((config) => config.pageId === pageId);
  if (!found) {
    throw new Error(`Unknown page content config: ${pageId}`);
  }
  return found;
}

export function getEmptySlotData(): PageContentSlotData {
  return { enabled: false, imageUrl: "", imagePath: "" };
}
