"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import SiteLogo from "@/components/layout/SiteLogo";
import { useFooterSettings } from "@/hooks/useFooterSettings";
import { BRAND_DOMAIN, BRAND_NAME } from "@/lib/constants/brand";
import type { FooterLink } from "@/types/footer";

function FooterLinkList({ title, links }: { title: string; links: FooterLink[] }) {
  const visible = links.filter((link) => link.enabled && link.label.trim() && link.href.trim());
  if (visible.length === 0) return null;

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">{title}</p>
      <ul className="mt-3 space-y-2">
        {visible.map((link) => {
          const isExternal = link.href.startsWith("http");
          return (
            <li key={`${title}-${link.href}-${link.label}`}>
              {isExternal ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-white/75 transition hover:text-white"
                >
                  {link.label}
                </a>
              ) : (
                <Link href={link.href} className="text-sm font-medium text-white/75 transition hover:text-white">
                  {link.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  if (!href.trim()) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
    >
      {children}
    </a>
  );
}

export default function Footer() {
  const { settings } = useFooterSettings();
  const year = new Date().getFullYear();

  return (
    <footer data-nosnippet className="mt-8 border-t border-[#163c64] bg-[#0F2A4A]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 md:grid-cols-[1.2fr_2fr] md:items-start">
        <div>
          <SiteLogo variant="white" size="md" />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">{settings.tagline}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <SocialIcon href={settings.instagramUrl} label="Instagram">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5.5A3.5 3.5 0 1 0 15.5 12 3.5 3.5 0 0 0 12 8.5zm5.75-3.25a1 1 0 1 0-1 1 1 1 0 0 0 1-1z" />
              </svg>
            </SocialIcon>
            <SocialIcon href={settings.linkedinUrl} label="LinkedIn">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M6.5 9.5h3v9h-3zm1.5-4.5a1.75 1.75 0 1 1-1.75 1.75A1.75 1.75 0 0 1 8 5zM11 9.5h2.9v1.23h.04a3.18 3.18 0 0 1 2.86-1.57c3.05 0 3.62 2 3.62 4.61V18.5h-3v-4.43c0-1.06 0-2.42-1.48-2.42s-1.7 1.15-1.7 2.34v4.51H11z" />
              </svg>
            </SocialIcon>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <FooterLinkList title="Platform" links={settings.platformLinks} />
          <FooterLinkList title="Hesap" links={settings.accountLinks} />
          <FooterLinkList title="Kurumsal" links={settings.corporateLinks} />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">İletişim</p>
            <div className="mt-3 space-y-2 text-sm text-white/75">
              {settings.contactEmail ? (
                <a href={`mailto:${settings.contactEmail}`} className="block transition hover:text-white">
                  {settings.contactEmail}
                </a>
              ) : null}
              {settings.contactNote ? <p>{settings.contactNote}</p> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#0c223c]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} {BRAND_NAME}. Tüm hakları saklıdır.
          </span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {settings.bottomLinks
              .filter((link) => link.enabled && link.label.trim() && link.href.trim())
              .map((link) => (
                <Link key={`bottom-${link.href}-${link.label}`} href={link.href} className="transition hover:text-white">
                  {link.label}
                </Link>
              ))}
            <span className="text-white/40">{BRAND_DOMAIN}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
