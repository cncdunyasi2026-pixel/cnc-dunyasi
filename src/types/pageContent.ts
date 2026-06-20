import type { PageHeroId } from "@/types/pageHero";

export type HomeContentSlotId =
  | "above_weekly_deals"
  | "between_ads_and_services"
  | "below_jobs";

export type ListingContentSlotId =
  | "page_top"
  | "below_header"
  | "above_listings"
  | "below_listings"
  | "page_bottom";

export type PageContentSlotId = HomeContentSlotId | ListingContentSlotId;

export type PageContentSlotData = {
  enabled: boolean;
  imageUrl: string;
  imagePath: string;
  imageWidth?: number;
  imageHeight?: number;
};

export type PageContentSlotsMap = Partial<Record<PageContentSlotId, PageContentSlotData>>;

export type PageContentPreviewLayout =
  | "home-above-weekly"
  | "home-between-sections"
  | "home-below-jobs"
  | "listing-top-strip"
  | "listing-below-hero"
  | "listing-above-list"
  | "listing-below-list"
  | "listing-bottom";

export type PageContentDisplayMode = "container" | "fullBleed" | "listColumn";

export type PageContentSlotDefinition = {
  id: PageContentSlotId;
  label: string;
  description: string;
  recommendedWidth: number;
  recommendedHeight: number;
  /** Sitede görünen yaklaşık maksimum genişlik */
  displayMaxWidth: number;
  displayMode: PageContentDisplayMode;
  previewLayout: PageContentPreviewLayout;
  recommendedNote: string;
};

export type PageContentPageConfig = {
  pageId: PageHeroId;
  slots: PageContentSlotDefinition[];
};
