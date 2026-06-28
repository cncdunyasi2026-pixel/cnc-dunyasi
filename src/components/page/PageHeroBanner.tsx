"use client";

import Link from "next/link";
import { getPageHeroDefinition } from "@/lib/constants/pageHeroPages";
import { usePageHero } from "@/hooks/usePageHero";
import type { PageHeroId } from "@/types/pageHero";

type Props = {
  pageId: PageHeroId;
  className?: string;
  showCta?: boolean;
  /** Anasayfa hero'sunda sağdaki masaüstü form alanı */
  homeAside?: React.ReactNode;
};

export default function PageHeroBanner({
  pageId,
  className = "",
  showCta = true,
  homeAside,
}: Props) {
  const definition = getPageHeroDefinition(pageId);
  const { content } = usePageHero(pageId);

  if (definition.variant === "home") {
    return (
      <section className={`w-full pt-0 ${className}`}>
        <div className="relative overflow-hidden">
          <img
            src={definition.image}
            alt={definition.imageAlt}
            className={definition.imageClassName}
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-[#0F2A4A]/55" />

          <div
            className={`absolute inset-0 mx-auto flex w-full max-w-7xl px-4 pb-6 sm:items-center sm:px-8 sm:pb-0 ${
              homeAside ? "items-end justify-between" : "items-center justify-center"
            }`}
          >
            <div className={`max-w-xl ${homeAside ? "" : "text-center"}`}>
              <p
                className="text-xs font-semibold tracking-[0.2em] sm:text-sm"
                style={{ color: content.eyebrowColor }}
              >
                {content.eyebrow}
              </p>
              <h1
                className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl"
                style={{ color: content.titleColor }}
              >
                {content.title}
              </h1>
              <p className="mt-2 text-xs sm:mt-3 sm:text-sm" style={{ color: content.descriptionColor }}>
                {content.description}
              </p>
            </div>

            {homeAside}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className={`full-bleed relative mb-6 ${className}`}>
      <img src={definition.image} alt={definition.imageAlt} className={definition.imageClassName} />
      <div className="absolute inset-0 bg-[#0F2A4A]/65" />
      <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-8">
        <div className="max-w-3xl text-center">
          <p
            className="text-[10px] font-semibold tracking-[0.18em] sm:text-xs"
            style={{ color: content.eyebrowColor }}
          >
            {content.eyebrow}
          </p>
          <h1
            className="mt-2 text-2xl font-extrabold leading-tight sm:text-4xl"
            style={{ color: content.titleColor }}
          >
            {content.title}
          </h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: content.descriptionColor }}>
            {content.description}
          </p>
          {showCta && definition.ctaLabel && definition.ctaHref ? (
            <Link
              href={definition.ctaHref}
              className="mt-4 inline-flex rounded-[8px] bg-[#F26A1B] px-5 py-2 text-xs font-bold !text-white visited:!text-white hover:!text-white sm:text-sm"
            >
              {definition.ctaLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
