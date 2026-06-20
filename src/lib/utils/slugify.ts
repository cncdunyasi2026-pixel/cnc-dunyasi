export function slugifyTr(input: string): string {
  const tr = input
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/û/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return tr || "ilan";
}

export function uniqueSlugFromName(name: string): string {
  return `${slugifyTr(name)}-${Math.random().toString(36).slice(2, 10)}`;
}
