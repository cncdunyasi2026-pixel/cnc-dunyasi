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

/** İlanlarım kartından tıklanınca: yayında → vitrin, değilse → düzenleme (arşiv → önizleme). */
export function ownerAdListingHref(ad: { id: string; status?: string }): string {
  if (isAdPublishedPublic(ad.status)) {
    return `/ilan/${ad.id}`;
  }
  if (ad.status === "archived") {
    return `/hesap/ilanlarim/${ad.id}`;
  }
  return `/hesap/ilanlarim/duzenle/${ad.id}`;
}
