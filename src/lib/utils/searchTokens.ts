import { normalizeForSearch } from "@/lib/utils/searchText";

const MIN_PREFIX_LEN = 3;
const MAX_TOKENS = 400;

export function tokenizeSearchQuery(query: string): string[] {
  const normalized = normalizeForSearch(query);
  if (!normalized) return [];
  return [...new Set(normalized.split(/[^a-z0-9]+/).filter((part) => part.length >= 2))];
}

export function pickPrimarySearchToken(query: string): string | null {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) return null;
  return tokens.sort((a, b) => b.length - a.length)[0] ?? null;
}

export function buildSearchTokensFromBlob(blob: string): string[] {
  const words = normalizeForSearch(blob)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 2);

  const tokens = new Set<string>();
  for (const word of words) {
    tokens.add(word);
    for (let len = MIN_PREFIX_LEN; len < word.length; len += 1) {
      tokens.add(word.slice(0, len));
    }
  }

  return [...tokens].slice(0, MAX_TOKENS);
}

export function matchesTokenizedQuery(blob: string, query: string): boolean {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) return true;
  const normalizedBlob = normalizeForSearch(blob);
  return tokens.every((token) => normalizedBlob.includes(token));
}
