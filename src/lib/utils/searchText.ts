/**
 * Türkçe metin araması — I/İ/ı/i ve birleşik Unicode karakterlerini normalize eder.
 * Örn. başlıkta "İstanbul", aramada "Istanbul" veya "ist" aynı sonucu verir.
 */
export function normalizeForSearch(text: string): string {
  return text
    .trim()
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function matchesSearch(haystack: string | undefined | null, needle: string): boolean {
  if (!needle.trim()) return true;
  if (!haystack) return false;
  return normalizeForSearch(haystack).includes(normalizeForSearch(needle));
}

export function matchesAnySearch(fields: Array<string | undefined | null>, needle: string): boolean {
  if (!needle.trim()) return true;
  return fields.some((field) => matchesSearch(field, needle));
}
