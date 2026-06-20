"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isFirebaseClientConfigured } from "@/lib/firebase";

type ListingPublishFooter = {
  href: string;
  authenticatedLabel: string;
  guestLabel: string;
};

const DEFAULT_LISTING_FOOTER: ListingPublishFooter = {
  href: "/ilan-ver",
  authenticatedLabel: "← İlan türü seçimine dön",
  guestLabel: "← Tüm ilan türleri",
};

type ListingPublishShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: ListingPublishFooter;
};

export default function ListingPublishShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer = DEFAULT_LISTING_FOOTER,
}: ListingPublishShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isFirebaseClientConfigured) return;
    if (!user) {
      router.replace(`/hesap/giris?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, pathname, router]);

  if (loading || (isFirebaseClientConfigured && !user)) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center bg-[#f3f5f8]">
        <p className="text-sm font-semibold text-[#7A8CA5]">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] bg-[#f3f5f8] py-8 md:py-12">
      <div className="mx-auto w-full max-w-2xl px-4">
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#dbe2ea] bg-white shadow-[0_12px_40px_rgba(15,42,74,0.08)]">
          <div className="bg-gradient-to-r from-[#0F2A4A] to-[#1A4A7A] px-6 py-7 text-center text-white md:text-left">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-[#7A8CA5]">{eyebrow}</p>
            <h1 className="mt-2 text-2xl font-extrabold md:text-3xl">{title}</h1>
            <p className="mt-2 max-w-xl text-sm text-white/85">{subtitle}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#dbe2ea] bg-white p-6 shadow-sm md:p-8">{children}</div>

        <p className="mt-4 text-center text-xs text-[#7A8CA5]">
          <Link href={footer.href} className="font-semibold hover:text-[#0F2A4A]">
            {footer.authenticatedLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
