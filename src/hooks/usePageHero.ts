"use client";

import { useEffect, useState } from "react";
import { getPageHeroDefinition } from "@/lib/constants/pageHeroPages";
import { getPageHeroContent } from "@/services/pageHeroService";
import type { PageHeroContent, PageHeroId } from "@/types/pageHero";

type UsePageHeroResult = {
  content: PageHeroContent;
  loading: boolean;
};

export function usePageHero(pageId: PageHeroId): UsePageHeroResult {
  const [content, setContent] = useState<PageHeroContent>(() => getPageHeroDefinition(pageId).defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const defaults = getPageHeroDefinition(pageId).defaults;

    void getPageHeroContent(pageId)
      .then((data) => {
        if (!cancelled) setContent(data);
      })
      .catch(() => {
        if (!cancelled) setContent(defaults);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pageId]);

  return { content, loading };
}
