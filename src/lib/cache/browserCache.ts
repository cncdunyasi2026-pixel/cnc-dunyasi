import { CACHE_SCHEMA_VERSION, type CachePolicy } from "@/lib/cache/policies";

type CacheEnvelope<T> = {
  v: string;
  at: number;
  data: T;
};

export type CacheReadResult<T> = {
  data: T;
  isStale: boolean;
  source: "memory" | "session";
};

const memoryStore = new Map<string, CacheEnvelope<unknown>>();
const inflightRequests = new Map<string, Promise<unknown>>();

function storageKey(key: string): string {
  return `cncd-cache:${CACHE_SCHEMA_VERSION}:${key}`;
}

function isExpired(fetchedAt: number, policy: CachePolicy): boolean {
  return Date.now() - fetchedAt > policy.ttlMs;
}

function isStale(fetchedAt: number, policy: CachePolicy): boolean {
  return Date.now() - fetchedAt > policy.staleMs;
}

function readFromMemory<T>(key: string, policy: CachePolicy): CacheReadResult<T> | null {
  const entry = memoryStore.get(key) as CacheEnvelope<T> | undefined;
  if (!entry || entry.v !== CACHE_SCHEMA_VERSION || isExpired(entry.at, policy)) {
    return null;
  }

  return {
    data: entry.data,
    isStale: isStale(entry.at, policy),
    source: "memory",
  };
}

function readFromSession<T>(key: string, policy: CachePolicy): CacheReadResult<T> | null {
  if (policy.storage !== "session" || typeof sessionStorage === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(storageKey(key));
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEnvelope<T>;
    if (entry.v !== CACHE_SCHEMA_VERSION || isExpired(entry.at, policy)) {
      sessionStorage.removeItem(storageKey(key));
      return null;
    }

    memoryStore.set(key, entry);
    return {
      data: entry.data,
      isStale: isStale(entry.at, policy),
      source: "session",
    };
  } catch {
    return null;
  }
}

export function readBrowserCache<T>(key: string, policy: CachePolicy): CacheReadResult<T> | null {
  return readFromMemory<T>(key, policy) ?? readFromSession<T>(key, policy);
}

export function writeBrowserCache<T>(key: string, data: T, policy: CachePolicy): void {
  const entry: CacheEnvelope<T> = {
    v: CACHE_SCHEMA_VERSION,
    at: Date.now(),
    data,
  };

  memoryStore.set(key, entry);

  if (policy.storage !== "session" || typeof sessionStorage === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(storageKey(key), JSON.stringify(entry));
  } catch {
    /* Kotayı aşarsa yalnızca bellek katmanı kullanılır. */
  }
}

export function removeBrowserCache(key: string): void {
  memoryStore.delete(key);
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(storageKey(key));
  }
}

export function clearBrowserCacheByPrefix(prefix: string): void {
  for (const key of [...memoryStore.keys()]) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key);
    }
  }

  if (typeof sessionStorage === "undefined") return;

  for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
    const itemKey = sessionStorage.key(i);
    if (itemKey?.includes(`:${prefix}`)) {
      sessionStorage.removeItem(itemKey);
    }
  }
}

/** Firestore cursor gibi serileştirilemeyen değerler — yalnızca bellekte. */
const cursorMemory = new Map<string, unknown>();

export function writePaginationCursor(cacheKey: string, cursor: unknown): void {
  cursorMemory.set(`${cacheKey}:cursor`, cursor);
}

/** undefined = bellekte yok · null = bilinçli olarak son sayfa */
export function readPaginationCursor(cacheKey: string): unknown | undefined {
  const key = `${cacheKey}:cursor`;
  if (!cursorMemory.has(key)) return undefined;
  return cursorMemory.get(key);
}

export function clearPaginationCursor(cacheKey: string): void {
  cursorMemory.delete(`${cacheKey}:cursor`);
}

export type FetchWithCacheResult<T> = {
  data: T;
  fromCache: boolean;
  isStale: boolean;
};

/**
 * Tekil istek deduplication + TTL + stale-while-revalidate.
 * Taze önbellek varsa ağ isteği atılmaz.
 */
export async function fetchWithBrowserCache<T>(
  key: string,
  policy: CachePolicy,
  fetcher: () => Promise<T>,
  options?: { force?: boolean },
): Promise<FetchWithCacheResult<T>> {
  if (!options?.force) {
    const cached = readBrowserCache<T>(key, policy);
    if (cached) {
      if (!cached.isStale) {
        return { data: cached.data, fromCache: true, isStale: false };
      }

      if (!inflightRequests.has(key)) {
        const refresh = fetcher()
          .then((data) => {
            writeBrowserCache(key, data, policy);
            return data;
          })
          .finally(() => {
            inflightRequests.delete(key);
          });
        inflightRequests.set(key, refresh);
      }

      return { data: cached.data, fromCache: true, isStale: true };
    }
  }

  const existing = inflightRequests.get(key) as Promise<T> | undefined;
  if (existing) {
    const data = await existing;
    const cached = readBrowserCache<T>(key, policy);
    return {
      data,
      fromCache: Boolean(cached),
      isStale: cached?.isStale ?? false,
    };
  }

  const request = fetcher()
    .then((data) => {
      writeBrowserCache(key, data, policy);
      return data;
    })
    .finally(() => {
      inflightRequests.delete(key);
    });

  inflightRequests.set(key, request);
  const data = await request;
  return { data, fromCache: false, isStale: false };
}
