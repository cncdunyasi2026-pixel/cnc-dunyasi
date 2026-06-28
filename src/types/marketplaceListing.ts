import type { ListingLifecycleStatus } from "@/types/listingStatus";

export type MarketplaceListingRecord = {
  slug: string;
  name: string;
  title: string;
  city: string;
  district: string;
  neighborhood?: string;
  category: string;
  phone?: string;
  yearLabel: string;
  expertise: string;
  description: string;
  images: string[];
  imagePaths?: string[];
  ownerId: string;
  userName: string;
  status: ListingLifecycleStatus;
  /** Teknik Servis: hizmet tipi */
  serviceType?: string;
  /** Teknik Servis: uzman olduğu CNC markası */
  expertiseBrand?: string;
  /** Yedek Parça: parça kategorisi */
  partCategory?: string;
  /** Yedek Parça: marka uyumu */
  brandCompat?: string;
  /** Yedek Parça: stok durumu */
  stockStatus?: string;
};
