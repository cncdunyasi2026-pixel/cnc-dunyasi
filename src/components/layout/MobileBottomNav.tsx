"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/",
    label: "Anasayfa",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          d="M3.75 10.5 12 3.75l8.25 6.75V20.25a.75.75 0 0 1-.75.75H14.25v-5.25h-4.5V21H4.5a.75.75 0 0 1-.75-.75V10.5Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    href: "/kategori/yedek-parca",
    label: "Yedek Parca",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          d="M13.5 3.75a1.5 1.5 0 0 1 1.5 1.5v1.02a6.77 6.77 0 0 1 1.744.724l.72-.72a1.5 1.5 0 1 1 2.122 2.122l-.72.72c.31.545.553 1.13.724 1.744h1.02a1.5 1.5 0 1 1 0 3h-1.02a6.77 6.77 0 0 1-.724 1.744l.72.72a1.5 1.5 0 1 1-2.122 2.122l-.72-.72a6.77 6.77 0 0 1-1.744.724v1.02a1.5 1.5 0 1 1-3 0v-1.02a6.77 6.77 0 0 1-1.744-.724l-.72.72a1.5 1.5 0 1 1-2.122-2.122l.72-.72a6.77 6.77 0 0 1-.724-1.744H3.75a1.5 1.5 0 1 1 0-3h1.02c.17-.614.414-1.2.724-1.744l-.72-.72a1.5 1.5 0 1 1 2.122-2.122l.72.72A6.77 6.77 0 0 1 9.36 6.27V5.25a1.5 1.5 0 0 1 1.5-1.5h2.64Zm-1.32 5.25a3.36 3.36 0 1 0 0 6.72 3.36 3.36 0 0 0 0-6.72Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    href: "/ilanlar",
    label: "Ikinci El CNC",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          d="M4.5 6A1.5 1.5 0 0 1 6 4.5h12A1.5 1.5 0 0 1 19.5 6v9A1.5 1.5 0 0 1 18 16.5h-1.5V18a1.5 1.5 0 1 1-3 0v-1.5h-3V18a1.5 1.5 0 1 1-3 0v-1.5H6A1.5 1.5 0 0 1 4.5 15V6Zm3 .75a.75.75 0 0 0-.75.75v6a.75.75 0 0 0 .75.75H9V6.75H7.5Zm9 0H15v7.5h1.5a.75.75 0 0 0 .75-.75v-6a.75.75 0 0 0-.75-.75ZM11.25 9h1.5v3h-1.5V9Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    href: "/kariyer",
    label: "Kariyer",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          d="M7.5 6.75V6a4.5 4.5 0 0 1 9 0v.75h1.5A2.25 2.25 0 0 1 20.25 9v9.75A2.25 2.25 0 0 1 18 21H6A2.25 2.25 0 0 1 3.75 18.75V9A2.25 2.25 0 0 1 6 6.75h1.5Zm1.5 0h6V6a3 3 0 0 0-6 0v.75Zm3 5.25a1.5 1.5 0 0 0-.75 2.799V16.5h1.5v-1.701A1.5 1.5 0 0 0 12 12Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    href: "/kategori/teknik-servis",
    label: "Teknik Servis",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          d="M14.25 3.75a2.25 2.25 0 0 1 2.25 2.25v.75h.75a2.25 2.25 0 0 1 0 4.5h-.75v6.75a2.25 2.25 0 0 1-2.25 2.25h-4.5a2.25 2.25 0 0 1-2.25-2.25V11.25h-.75a2.25 2.25 0 0 1 0-4.5h.75V6a2.25 2.25 0 0 1 2.25-2.25h4.5Zm-3 6.75v6.75h1.5v-6.75h-1.5Zm-3-3h7.5V6h-7.5v1.5Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  if (href === "/ilanlar") {
    return (
      pathname.startsWith("/ilanlar") ||
      pathname.startsWith("/ilan/") ||
      pathname.startsWith("/ilan-ver")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dbe2ea] bg-white md:hidden">
      <div className="grid grid-cols-5 items-end px-0.5 pb-[env(safe-area-inset-bottom,0)] pt-1">
        {navItems.map((item) => {
          const active = isNavItemActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-t-xl px-1 text-center transition active:opacity-90 ${
                active ? "bg-[#e8eef6]" : ""
              }`}
            >
              {active ? (
                <span
                  aria-hidden
                  className="absolute left-2 right-2 top-0 h-0.5 rounded-full bg-[#F26A1B]"
                />
              ) : null}
              <span
                className={`transition [&>svg]:h-6 [&>svg]:w-6 ${
                  active ? "text-[#F26A1B]" : "text-[#7A8CA5] hover:text-[#0F2A4A]"
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`max-w-[72px] truncate text-[11px] leading-tight ${
                  active ? "font-extrabold text-[#0F2A4A]" : "font-semibold text-[#5f6f86]"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
