/**
 * Open redirect engeli: sadece ic path kabul edilir.
 */
export function getSafePostAuthRedirect(redirect: string | null | undefined): string {
  if (redirect == null || redirect === "") return "/hesap/profil";
  const t = redirect.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/hesap/profil";
  return t;
}

/** Giriş/kayıt linklerinde `?redirect=` ile güvenli path aktarır. */
export function withRedirectQuery(base: string, redirect: string | null): string {
  if (redirect == null || redirect === "") return base;
  const t = redirect.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}redirect=${encodeURIComponent(t)}`;
}
