"use client";

import Link from "next/link";
import SiteLogo from "@/components/layout/SiteLogo";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

type Props = {
  adminCode: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function AdminSectionLayout({ adminCode, title, subtitle, children }: Props) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const base = `/${adminCode}/admin`;

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  const closeSidebar = () => setSidebarOpen(false);

  const navItems = [
    { href: `${base}/dashboard`, label: "Dashboard", icon: <GridIcon /> },
    { href: `${base}/anasayfa`, label: "Anasayfa Yönetimi", icon: <HomeIcon /> },
    { href: `${base}/moderasyon`, label: "İlan Moderasyonu", icon: <ShieldIcon /> },
    { href: `${base}/kullanicilar`, label: "Kullanıcılar", icon: <UsersIcon /> },
    { href: `${base}/raporlar`, label: "Raporlar & Analiz", icon: <FlagIcon /> },
    { href: `${base}/markalar`, label: "Site Verileri", icon: <TagIcon /> },
    { href: `${base}/audit-log`, label: "Audit Log", icon: <ListIcon /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#060f1e] text-white">
      {/* Mobil backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeSidebar}
        aria-hidden={!sidebarOpen}
      />

      {/* ─── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-shrink-0 flex-col overflow-y-auto border-r border-white/[0.06] bg-gradient-to-b from-[#0b1729] to-[#09152270] transition-transform duration-300 ease-in-out md:static md:z-auto md:w-60 md:max-w-none md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="flex items-start justify-between border-b border-white/[0.06] px-5 py-5">
          <div className="min-w-0">
            <SiteLogo variant="white" href="" size="sm" />
            <p className="mt-2 text-[11px] font-semibold text-white/45">Admin Panel</p>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-white/60 transition hover:bg-white/[0.08] hover:text-white md:hidden"
            aria-label="Menüyü kapat"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-white/25">
            Yönetim
          </p>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-[0_2px_16px_rgba(37,99,235,0.4)]"
                    : "text-[#6a94bc] hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <span className={`flex-shrink-0 ${isActive ? "text-white" : "text-blue-500/40"}`}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />
                )}
              </Link>
            );
          })}

          <div className="my-3 border-t border-white/[0.06]" />
          <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-white/25">
            Site
          </p>
          <Link
            href="/"
            target="_blank"
            onClick={closeSidebar}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#6a94bc] transition hover:bg-white/[0.05] hover:text-white"
          >
            <ExternalLinkIcon />
            Siteyi Görüntüle
          </Link>
        </nav>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-3 pb-5 pt-3">
          {user?.email && (
            <div className="mb-2 rounded-xl bg-white/[0.04] px-3 py-2.5">
              <p className="text-[10px] text-white/30">Giriş yapılan hesap</p>
              <p className="mt-0.5 truncate text-[11px] font-semibold text-white/70">
                {user.email}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              closeSidebar();
              void signOut(auth);
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-rose-400/80 transition hover:bg-rose-900/20 hover:text-rose-300"
          >
            <LogoutIcon />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────── */}
      <main className="flex min-w-0 flex-1 flex-col overflow-auto">
        {/* Mobil üst bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/[0.06] bg-[#0a1729]/95 px-4 py-3 backdrop-blur-sm md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/[0.08] hover:text-white"
            aria-label="Menüyü aç"
          >
            <MenuIcon />
          </button>
          <div className="min-w-0 flex-1">
            {title ? (
              <>
                <h1 className="truncate text-base font-extrabold text-white">{title}</h1>
                {subtitle && (
                  <p className="truncate text-xs text-[#6a94bc]">{subtitle}</p>
                )}
              </>
            ) : (
              <p className="text-sm font-semibold text-white/70">Admin Panel</p>
            )}
          </div>
        </div>

        {/* Page header — masaüstü */}
        {title && (
          <div className="hidden border-b border-white/[0.06] bg-[#0a1729]/60 px-6 py-5 backdrop-blur-sm md:block">
            <h1 className="text-xl font-extrabold text-white">{title}</h1>
            {subtitle && (
              <p className="mt-0.5 text-sm text-[#6a94bc]">{subtitle}</p>
            )}
          </div>
        )}
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────────────── */

function HomeIcon() {
  return (
    <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" strokeLinejoin="round" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" strokeLinejoin="round" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" strokeLinejoin="round" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line strokeLinecap="round" x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <line strokeLinecap="round" x1="8" y1="6" x2="21" y2="6" />
      <line strokeLinecap="round" x1="8" y1="12" x2="21" y2="12" />
      <line strokeLinecap="round" x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3" cy="6" r="0.5" fill="currentColor" />
      <circle cx="3" cy="12" r="0.5" fill="currentColor" />
      <circle cx="3" cy="18" r="0.5" fill="currentColor" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline strokeLinecap="round" strokeLinejoin="round" points="16 17 21 12 16 7" />
      <line strokeLinecap="round" x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline strokeLinecap="round" strokeLinejoin="round" points="15 3 21 3 21 9" />
      <line strokeLinecap="round" x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
