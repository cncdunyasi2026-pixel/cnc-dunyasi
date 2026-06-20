import type { ListingLifecycleStatus } from "@/types/listingStatus";

export type Currency = "TRY" | "USD" | "EUR" | "GBP";

export type Ad = {
  id: string;
  title: string;
  /** Tam metin arama için normalize edilmiş token listesi (Firestore). */
  searchTokens?: string[];
  brand?: string;
  model?: string;
  price: number;
  /** Para birimi; belirtilmezse TRY kabul edilir. */
  currency?: Currency;
  city: string;
  district: string;
  /** Mahalle veya köy adı */
  neighborhood?: string;
  category: string;
  condition?: string;
  /** Üretim yılı (1990–2045) */
  year?: number;
  /** Güç (kW) */
  powerKw?: number;
  /** Tezgah genişliği (mm) */
  tableWidthMm?: number;
  /** Tezgah uzunluğu (mm) */
  tableLengthMm?: number;
  /** Eksen sayısı, ör: "3 Eksen" */
  axisCount?: string;
  /** Kimden: "Satıcıdan" | "Mağazadan" */
  sellerType?: string;
  trade?: string;
  delivery?: string;
  description?: string;
  images: string[];
  imagePaths?: string[];
  /** Opsiyonel tanıtım videosu (max 1 dk). */
  video?: string;
  videoPath?: string;
  ownerId: string;
  userName: string;
  createdAt: number;
  status?: ListingLifecycleStatus;
  /** Anasayfa «Öne çıkan ilanlar» (Console / moderasyon `isFeatured: true`). */
  isFeatured?: boolean;
  /** Anasayfa «Haftanın fırsatları» (Console `weeklyDeal: true`). */
  weeklyDeal?: boolean;
  /** Moderasyon yayına alırken (staff); vitrin sıralamasında kullanılabilir. */
  publishedAt?: number;
  /** Yayındaki ilanın revizyon talebi ise orijinal ilan referansı. */
  sourceListingId?: string;
  /** Kullanici silme talebinde arsive alindigi an (6 ay sonra fiziksel cleanup). */
  deletedAt?: number;
  /** Admin `needs_revision` ile bıraktığı not; sahip düzenleyip tekrar pending gönderebilir. */
  revisionNote?: string;
  /** Alan bazli revizyon notlari (or: { title: "...", price: "..." }). */
  revisionFields?: Record<string, string>;
  /** Ilan detay goruntuleme sayisi. */
  clickCount?: number;
  /** Kullanıcı güncellemesinde değişen alan anahtarları (admin'e diff göstermek için). */
  changedFields?: string[];
  /** Kullanıcı tezgah etiketinin (nameplate) olmadığını beyan etti. */
  machineLabelMissing?: boolean;
  /** Odeme tamamlandi durumu (simdilik mock akis). */
  isPaid?: boolean;
  /** Listeleme ucreti (TL). */
  listingFee?: number;
  /** Kampanya/indirim sonrasi odenecek tutar (TL). */
  discountedFee?: number;
  /** Odemenin basladigi an. */
  paymentStartedAt?: number;
  /** Odeme son tarihi. */
  paymentDueAt?: number;
};
