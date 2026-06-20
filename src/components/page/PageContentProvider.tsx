"use client";

import { useContext, useEffect, useState } from "react";
import { PageContentContext } from "@/contexts/PageContentContext";
import { getPageContentConfig } from "@/lib/constants/pageContentSlots";
import { getPageContentSlots } from "@/services/pageContentService";
import type { PageContentSlotId, PageContentSlotsMap } from "@/types/pageContent";
import type { PageHeroId } from "@/types/pageHero";

export default function PageContentProvider({
  pageId,
  children,
}: {
  pageId: PageHeroId;
  children: React.ReactNode;
}) {
  const [slots, setSlots] = useState<PageContentSlotsMap>(() => {
    const empty: PageContentSlotsMap = {};
    for (const slot of getPageContentConfig(pageId).slots) {
      empty[slot.id] = { enabled: false, imageUrl: "", imagePath: "" };
    }
    return empty;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void getPageContentSlots(pageId)
      .then((data) => {
        if (!cancelled) setSlots(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pageId]);

  return (
    <PageContentContext.Provider value={{ slots, loading }}>
      {children}
    </PageContentContext.Provider>
  );
}

export function usePageContentSlot(pageId: PageHeroId, slotId: PageContentSlotId) {
  const ctx = useContext(PageContentContext);
  const [fallback, setFallback] = useState<PageContentSlotsMap>(() => ({}));

  useEffect(() => {
    if (ctx) return;
    let cancelled = false;
    void getPageContentSlots(pageId).then((data) => {
      if (!cancelled) setFallback(data);
    });
    return () => {
      cancelled = true;
    };
  }, [ctx, pageId]);

  const slots = ctx?.slots ?? fallback;
  return slots[slotId];
}
