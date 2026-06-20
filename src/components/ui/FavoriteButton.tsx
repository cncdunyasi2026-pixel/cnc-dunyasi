"use client";

import Link from "next/link";
import { useFavorite } from "@/hooks/useFavorite";
import type { FavoriteKind } from "@/services/favoritesService";

type Props = {
  kind: FavoriteKind;
  id: string;
  slug: string;
  title: string;
  image: string;
  /** "icon" = sadece kalp ikonu (detail sayfası köşesi), "full" = yazılı buton (liste) */
  variant?: "icon" | "full";
  className?: string;
};

export default function FavoriteButton({
  kind,
  id,
  slug,
  title,
  image,
  variant = "icon",
  className = "",
}: Props) {
  const { isFavorited, loading, toggle, requiresAuth } = useFavorite(kind, id, slug, title, image);

  if (requiresAuth) {
    // Giriş yapmamış kullanıcıya giriş sayfasına yönlendir
    const redirect = typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : "";
    const loginHref = redirect ? `/hesap/giris?redirect=${redirect}` : "/hesap/giris";
    return (
      <Link
        href={loginHref}
        title="Favorilere eklemek için giriş yap"
        className={variant === "full" ? fullClass(false) : iconClass(false, className)}
      >
        {variant === "full" ? (
          <>
            <HeartIcon filled={false} />
            <span>Favorilere ekle</span>
          </>
        ) : (
          <HeartIcon filled={false} />
        )}
      </Link>
    );
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={`${fullClass(isFavorited)} ${className}`}
        title={isFavorited ? "Favorilerden kaldır" : "Favorilere ekle"}
      >
        <HeartIcon filled={isFavorited} />
        <span>{isFavorited ? "Favorilerde" : "Favorilere ekle"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={iconClass(isFavorited, className)}
      title={isFavorited ? "Favorilerden kaldır" : "Favorilere ekle"}
    >
      <HeartIcon filled={isFavorited} />
    </button>
  );
}

/* ── Styles ─────────────────────────────────────────────────── */

function iconClass(active: boolean, extra: string) {
  return [
    "inline-flex items-center justify-center rounded-full p-2 transition",
    active
      ? "bg-rose-50 text-rose-500 hover:bg-rose-100"
      : "bg-white/80 text-[#7A8CA5] hover:bg-rose-50 hover:text-rose-400 border border-[#dbe2ea]",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

function fullClass(active: boolean) {
  return [
    "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition",
    active
      ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
      : "border-[#dbe2ea] bg-white text-[#0F2A4A] hover:border-rose-300 hover:text-rose-500",
  ].join(" ");
}

/* ── Heart SVG ──────────────────────────────────────────────── */

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  );
}
