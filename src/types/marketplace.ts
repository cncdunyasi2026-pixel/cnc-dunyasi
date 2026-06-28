export type MarketplaceProfile = {
  id: string;
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
  ownerId?: string;
  userName?: string;
  /** Teknik Servis: hizmet tipi (örn. "Periyodik Bakım", "Retrofit") */
  serviceType?: string;
  /** Teknik Servis: uzman olduğu CNC markası (örn. "Fanuc", "Siemens") */
  expertiseBrand?: string;
  /** Yedek Parça: parça kategorisi (örn. "Elektronik Kart", "Servo Motor") */
  partCategory?: string;
  /** Yedek Parça: marka uyumu (örn. "Fanuc", "Siemens") */
  brandCompat?: string;
  /** Yedek Parça: stok durumu */
  stockStatus?: "Stokta Var" | "Sipariş Üzerine";
};
