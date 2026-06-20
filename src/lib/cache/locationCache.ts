import { CACHE_POLICIES } from "@/lib/cache/policies";

/** Konum API yanıtları — CDN/tarayıcı HTTP önbelleği */
export const LOCATION_HTTP_CACHE_CONTROL =
  "public, max-age=3600, stale-while-revalidate=86400";

export const LOCATION_CACHE_POLICY = CACHE_POLICIES.locations;
