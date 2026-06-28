export type CachePolicy = {
  /** Bu süreden sonra önbellek kullanılmaz, yeniden istek atılır. */
  ttlMs: number;
  /** Bu süreden sonra veri gösterilir ama arka planda tazelenir. */
  staleMs: number;
  /** session: sekme yenilense de kalır · memory: yalnızca aynı oturum (SPA gezinmesi). */
  storage: "memory" | "session";
};

/** Önbellek şeması değişince artırın — eski kayıtlar otomatik yok sayılır. */
export const CACHE_SCHEMA_VERSION = "1";

export const CACHE_POLICIES = {
  /** İlan listeleri — ilk sayfa */
  listingsPage1: {
    ttlMs: 10 * 60 * 1000,
    staleMs: 2 * 60 * 1000,
    storage: "session",
  },
  /** Marka, kategori, pozisyon vb. site meta verileri */
  siteMetadata: {
    ttlMs: 60 * 60 * 1000,
    staleMs: 15 * 60 * 1000,
    storage: "session",
  },
  /** İl / ilçe / mahalle API yanıtları */
  locations: {
    ttlMs: 24 * 60 * 60 * 1000,
    staleMs: 60 * 60 * 1000,
    storage: "session",
  },
  /** Anasayfa ilan listesi */
  homeSections: {
    ttlMs: 10 * 60 * 1000,
    staleMs: 5 * 60 * 1000,
    storage: "session",
  },
} satisfies Record<string, CachePolicy>;
