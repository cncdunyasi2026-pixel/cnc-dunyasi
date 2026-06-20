"use client";

import { getPageContentConfig } from "@/lib/constants/pageContentSlots";
import { usePageContentSlot } from "@/components/page/PageContentProvider";
import PageContentSlotView from "@/components/page/PageContentSlotView";
import type { PageContentSlotId } from "@/types/pageContent";
import type { PageHeroId } from "@/types/pageHero";

type Props = {
  pageId: PageHeroId;
  slotId: PageContentSlotId;
  className?: string;
};

export default function PageContentSlot({ pageId, slotId, className = "" }: Props) {
  const slot = usePageContentSlot(pageId, slotId);
  const definition = getPageContentConfig(pageId).slots.find((item) => item.id === slotId);

  if (!slot?.enabled || !slot.imageUrl || !definition) {
    return null;
  }

  return (
    <PageContentSlotView
      definition={definition}
      imageUrl={slot.imageUrl}
      className={className}
    />
  );
}
