import { fetchWithBrowserCache } from "@/lib/cache/browserCache";
import { CACHE_POLICIES } from "@/lib/cache/policies";

/**
 * Firestore'dan gelen statik listeler için tarayıcı önbelleği.
 * Admin güncellemesi sonrası en geç staleMs içinde tazelenir.
 */
export async function fetchCachedList<T>(
  cacheKey: string,
  fetcher: () => Promise<T[]>,
  policy = CACHE_POLICIES.siteMetadata,
): Promise<T[]> {
  const { data } = await fetchWithBrowserCache(cacheKey, policy, fetcher);
  return data;
}
