"use client";

import Link from "next/link";
import SiteLogo from "@/components/layout/SiteLogo";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { auth, isFirebaseClientConfigured } from "@/lib/firebase";
import { getAdminPathCode } from "@/lib/admin/adminAccess";
import { useState, useEffect } from "react";

/* ── Drawer menü öğeleri ───────────────────────────────────── */

const MENU_ITEMS = [
  {
    href: "/hesap/ilanlarim",
    label: "İlanlarım",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: "/hesap/favoriler",
    label: "Favorilerim",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    href: "/hesap/mesajlar",
    label: "Mesajlaşmalar",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    href: "/hesap/bildirimler",
    label: "Bildirimler",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    href: "/ilan-ver",
    label: "Yeni İlan Ver",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/hesap/ayarlar",
    label: "Hesap Ayarları",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

/* ── Hamburger çekmecesi ────────────────────────────────────── */

function HamburgerDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const router = useRouter();

  const initials = user?.displayName
    ? user.displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  const handleSignOut = () => {
    onClose();
    if (!isFirebaseClientConfigured) return;
    void signOut(auth).then(() => router.refresh());
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Üst: kullanıcı bilgisi */}
        <div className="bg-[#0F2A4A] px-5 pb-5 pt-10">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-black text-white">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-white">
                  {user.displayName ?? "Kullanıcı"}
                </p>
                <p className="truncate text-xs text-white/60">{user.email}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-sm font-semibold text-white/70">Hesabınıza giriş yapın</p>
              <div className="flex gap-2">
                <Link
                  href="/hesap/giris"
                  onClick={onClose}
                  className="flex-1 rounded-xl bg-white px-3 py-2 text-center text-xs font-bold text-[#0F2A4A]"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/hesap/kayit"
                  onClick={onClose}
                  className="flex-1 rounded-xl bg-[#F26A1B] px-3 py-2 text-center text-xs font-bold !text-white"
                >
                  Kayıt Ol
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Menü öğeleri */}
        <nav className="flex-1 overflow-y-auto py-2">
          {user &&
            MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-5 py-3.5 text-sm font-semibold text-[#0F2A4A] transition hover:bg-[#f4f7fb]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eef2f8] text-[#0F2A4A]">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}

          <div className="mx-4 my-2 border-t border-[#eef2f6]" />

          {/* Kategori linkleri */}
          {[
            { href: "/ilanlar", label: "İkinci El CNC" },
            { href: "/kategori/teknik-servis", label: "Teknik Servis" },
            { href: "/kategori/yedek-parca", label: "Yedek Parça" },
            { href: "/kariyer", label: "Kariyer" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-[#5f6f86] transition hover:bg-[#f4f7fb] hover:text-[#0F2A4A]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Çıkış */}
        {user && (
          <div className="border-t border-[#eef2f6] p-4">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Çıkış Yap
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Header ─────────────────────────────────────────────────── */

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useAdminAccess();
  const adminPathCode = getAdminPathCode();
  const adminHref =
    user && adminPathCode && isAdmin
      ? `/${adminPathCode}/admin/dashboard`
      : null;

  const [drawerOpen, setDrawerOpen] = useState(false);

  /* Sayfa değişince drawer'ı kapat */
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  /* Ana listeler ve statik sayfalar hariç her yerde geri butonu göster */
  const TOP_LEVEL = ["/", "/ilanlar", "/kategori/teknik-servis", "/kategori/yedek-parca", "/kariyer", "/hesap/giris", "/hesap/kayit", "/hesap/profil"];
  const showMobileBack = !TOP_LEVEL.includes(pathname);

  /* Bazı sayfalar için geri butonu belirli bir URL'e gitsin */
  const backHref: Record<string, string> = {
    "/hesap/mesajlar": "/hesap/profil",
  };
  if (/^\/hesap\/mesajlar\/.+/.test(pathname)) backHref[pathname] = "/hesap/mesajlar";

  return (
    <>
      <HamburgerDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <header className="border-b border-[#d7dce3] bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 md:py-5">
          {/* ── Mobil header ── */}
          <div className="relative flex min-h-11 items-center justify-between md:hidden">
            {/* Sol: hamburger (top level) veya geri butonu */}
            <div className="relative z-10 flex items-center">
              {!showMobileBack ? (
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-[#0F2A4A] transition hover:bg-[#f0f3f8]"
                  aria-label="Menüyü aç"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              ) : backHref[pathname] ? (
                <Link
                  href={backHref[pathname]}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#0F2A4A]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Geri
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#0F2A4A]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Geri
                </button>
              )}
            </div>

            {/* Orta: logo — hamburger ile İLAN VER arasında ortalanır */}
            <div className="pointer-events-none absolute inset-y-0 left-9 right-[4.75rem] flex items-center justify-center">
              <div className="pointer-events-auto translate-x-1">
                <SiteLogo size="sm" priority />
              </div>
            </div>

            {/* Sağ: İlan ver */}
            <div className="relative z-10 flex">
              <Link
                href="/ilan-ver"
                className="whitespace-nowrap rounded-full bg-[#F26A1B] px-3 py-1.5 text-[10px] font-bold tracking-wide !text-white visited:!text-white hover:!text-white shadow-[0_4px_12px_rgba(242,106,27,0.28)] transition hover:bg-[#dd5f15]"
              >
                İLAN VER
              </Link>
            </div>
          </div>

          {/* ── Masaüstü header ── */}
          <div className="hidden items-center justify-between gap-8 md:flex">
            <SiteLogo size="lg" priority className="-ml-2" />
            <nav className="flex shrink-0 items-center gap-5 text-sm font-semibold text-[#0F2A4A] lg:gap-6">
              <Link href="/ilanlar" className="transition hover:text-[#F26A1B]">İKİNCİ EL CNC</Link>
              <Link href="/kategori/teknik-servis" className="transition hover:text-[#F26A1B]">TEKNİK SERVİS</Link>
              <Link href="/kategori/yedek-parca" className="transition hover:text-[#F26A1B]">YEDEK PARÇA</Link>
              <Link href="/kariyer" className="transition hover:text-[#F26A1B]">KARİYER</Link>
              {authLoading ? (
                <span className="inline-flex min-w-[10rem] justify-end text-xs font-semibold text-[#7A8CA5]">…</span>
              ) : user ? (
                <>
                  <Link href="/hesap/ilanlarim" className="transition hover:text-[#F26A1B]">İLANLARIM</Link>
                  <Link href="/hesap/favoriler" className="transition hover:text-[#F26A1B]">FAVORİLERİM</Link>
                  <Link href="/hesap/profil" className="transition hover:text-[#F26A1B]">PROFİL</Link>
                  <button
                    type="button"
                    className="rounded-full border border-[#c8d3e2] bg-white px-4 py-2 text-xs font-bold tracking-wide text-[#0F2A4A] transition hover:border-[#0F2A4A] hover:bg-[#f4f7fb]"
                    onClick={() => {
                      if (!isFirebaseClientConfigured) return;
                      void signOut(auth).then(() => router.refresh());
                    }}
                  >
                    ÇIKIŞ
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/hesap/kayit"
                    className="rounded-full border border-[#c8d3e2] bg-white px-4 py-2 text-xs font-bold tracking-wide text-[#0F2A4A] transition hover:border-[#0F2A4A] hover:bg-[#f4f7fb]"
                  >
                    KAYIT OL
                  </Link>
                  <Link
                    href="/hesap/giris"
                    className="rounded-full bg-gradient-to-r from-[#0F2A4A] to-[#1A4A7A] px-4 py-2 text-xs font-bold tracking-wide !text-white visited:!text-white hover:!text-white shadow-[0_8px_20px_rgba(15,42,74,0.25)] transition hover:translate-y-[-1px] hover:shadow-[0_10px_24px_rgba(15,42,74,0.3)]"
                  >
                    GİRİŞ YAP
                  </Link>
                </>
              )}
              <Link
                href="/ilan-ver"
                className="rounded-full bg-[#F26A1B] px-4 py-2 text-xs font-bold tracking-wide !text-white visited:!text-white hover:!text-white shadow-[0_8px_20px_rgba(242,106,27,0.28)] transition hover:translate-y-[-1px] hover:bg-[#dd5f15]"
              >
                İLAN VER
              </Link>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
