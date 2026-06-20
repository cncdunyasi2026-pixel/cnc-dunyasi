import type { PageContentSlotDefinition } from "@/types/pageContent";

export type PageContentDisplayMode = "container" | "fullBleed" | "listColumn";

export function getSlotWrapperClassName(
  definition: Pick<PageContentSlotDefinition, "displayMode">,
  extraClassName = "",
): string {
  const base =
    definition.displayMode === "fullBleed"
      ? "full-bleed relative mb-4"
      : definition.displayMode === "listColumn"
        ? "w-full my-4"
        : "full-bleed relative mb-4";

  return extraClassName ? `${base} ${extraClassName}`.trim() : base;
}

export function getSlotImageClassName(
  definition: Pick<PageContentSlotDefinition, "displayMode">,
): string {
  const base = "block h-auto w-full max-w-full";
  // Liste kolonu içi küçük banner — kartlarla uyumlu yuvarlak köşe
  if (definition.displayMode === "listColumn") {
    return `${base} rounded-xl`;
  }
  // Tam genişlik banner — hero ile aynı, köşe kırpması yok
  return `${base} rounded-none`;
}

export function formatRecommendedSize(definition: PageContentSlotDefinition): string {
  return `${definition.recommendedWidth} × ${definition.recommendedHeight} px`;
}

export function formatDisplayWidth(definition: PageContentSlotDefinition): string {
  if (definition.displayMode === "fullBleed") return "Tam ekran genişliği (100vw)";
  if (definition.displayMode === "listColumn") return `~${definition.displayMaxWidth}px (liste kolonu)`;
  return `~${definition.displayMaxWidth}px (max-w-7xl içi)`;
}

export async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Görsel boyutu okunamadı."));
    };
    img.src = url;
  });
}
