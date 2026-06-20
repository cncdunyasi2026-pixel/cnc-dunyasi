"use client";

import { createContext, useContext } from "react";
import type { PageContentSlotId, PageContentSlotsMap } from "@/types/pageContent";
import type { PageHeroId } from "@/types/pageHero";

type PageContentContextValue = {
  slots: PageContentSlotsMap;
  loading: boolean;
};

export const PageContentContext = createContext<PageContentContextValue | null>(null);

export function usePageContentContext(): PageContentContextValue {
  const ctx = useContext(PageContentContext);
  if (!ctx) {
    throw new Error("PageContentProvider gerekli");
  }
  return ctx;
}

export function usePageContentSlotFromContext(slotId: PageContentSlotId) {
  const { slots } = usePageContentContext();
  return slots[slotId];
}

export type { PageHeroId };
