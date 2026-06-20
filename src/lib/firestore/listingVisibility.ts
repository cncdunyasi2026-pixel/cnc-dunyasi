/** Firestore rules ile uyumlu: `status` yoksa (eski kayıt) vitrinde yayında sayılır. */
export function isListingPublishedPublic(data: Record<string, unknown>): boolean {
  return !("status" in data) || data.status === "published";
}

/**
 * Client-side getirilen ilan objesinin yayında olup olmadığını kontrol eder.
 * Eski kayıtlarda status alanı yoktur; onlar da yayında kabul edilir.
 */
export function isAdPublishedPublic(status: string | undefined): boolean {
  return !status || status === "published";
}
