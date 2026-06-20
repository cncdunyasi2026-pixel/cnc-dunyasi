"use client";

import { getSlotImageClassName, getSlotWrapperClassName } from "@/lib/utils/pageContentSlotUi";
import type { PageContentSlotDefinition } from "@/types/pageContent";

type Props = {
  definition: PageContentSlotDefinition;
  imageUrl: string;
  className?: string;
  /** Admin önizlemede full-bleed simülasyonu için */
  previewMode?: boolean;
};

export default function PageContentSlotView({
  definition,
  imageUrl,
  className = "",
  previewMode = false,
}: Props) {
  const wrapperClass = previewMode
    ? `w-full ${className}`.trim()
    : getSlotWrapperClassName(definition, className);

  return (
    <div className={wrapperClass}>
      <img
        src={imageUrl}
        alt=""
        className={getSlotImageClassName(definition)}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
