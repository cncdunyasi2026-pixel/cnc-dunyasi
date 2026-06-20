"use client";

import PageContentSlotView from "@/components/page/PageContentSlotView";
import { formatDisplayWidth, formatRecommendedSize } from "@/lib/utils/pageContentSlotUi";
import type { PageContentPreviewLayout, PageContentSlotDefinition } from "@/types/pageContent";

type Props = {
  definition: PageContentSlotDefinition;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
};

function WireBox({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border border-dashed border-[#c5d0de] bg-white/70 ${className}`}>
      {children ?? (
        <p className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-[#7A8CA5]">{label}</p>
      )}
    </div>
  );
}

function SlotHighlight({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-lg ring-2 ring-[#F26A1B] ring-offset-2 ring-offset-[#f3f5f8]">
      <span className="absolute -top-2 left-2 z-10 rounded bg-[#F26A1B] px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">
        Bu alan
      </span>
      {children}
    </div>
  );
}

function PreviewCanvas({
  layout,
  definition,
  imageUrl,
}: {
  layout: PageContentPreviewLayout;
  definition: PageContentSlotDefinition;
  imageUrl?: string;
}) {
  const slotContent = imageUrl ? (
    <PageContentSlotView definition={definition} imageUrl={imageUrl} previewMode className="my-0" />
  ) : (
    <WireBox label="Görsel alanı" className="flex min-h-[48px] items-center justify-center bg-[#eef2f7]" />
  );

  switch (layout) {
    case "home-above-weekly":
      return (
        <div className="space-y-2 p-3">
          <WireBox label="Hero banner" className="h-14 bg-[#0F2A4A]/20" />
          <SlotHighlight>{slotContent}</SlotHighlight>
          <WireBox label="Haftanın Fırsatları" className="h-10" />
        </div>
      );

    case "home-between-sections":
      return (
        <div className="space-y-2 p-3">
          <WireBox label="Öne Çıkanlar › İlanlar" className="h-16" />
          <SlotHighlight>{slotContent}</SlotHighlight>
          <WireBox label="Öne Çıkanlar › Teknik Servisler" className="h-12" />
        </div>
      );

    case "home-below-jobs":
      return (
        <div className="space-y-2 p-3">
          <WireBox label="Öne Çıkanlar › İş İlanları" className="h-14" />
          <SlotHighlight>{slotContent}</SlotHighlight>
          <WireBox label="Alt promo alanı" className="h-10" />
        </div>
      );

    case "listing-top-strip":
      return (
        <div className="space-y-0">
          <SlotHighlight>{slotContent}</SlotHighlight>
          <div className="space-y-2 p-3 pt-2">
            <WireBox label="Header / banner görseli" className="h-16 bg-[#0F2A4A]/20" />
            <div className="grid grid-cols-[72px_1fr] gap-2">
              <WireBox label="Filtre" className="h-20" />
              <WireBox label="Liste alanı" className="h-20" />
            </div>
          </div>
        </div>
      );

    case "listing-below-hero":
      return (
        <div className="space-y-2 p-3">
          <WireBox label="Header / banner görseli" className="h-16 bg-[#0F2A4A]/20" />
          <SlotHighlight>{slotContent}</SlotHighlight>
          <div className="grid grid-cols-[72px_1fr] gap-2">
            <WireBox label="Filtre sidebar" className="h-20" />
            <WireBox label="Arama + ilan listesi" className="h-20" />
          </div>
        </div>
      );

    case "listing-above-list":
      return (
        <div className="space-y-2 p-3">
          <WireBox label="Header / banner görseli" className="h-12 bg-[#0F2A4A]/20" />
          <div className="grid grid-cols-[72px_1fr] gap-2">
            <WireBox label="Filtre" className="h-24" />
            <div className="space-y-2">
              <SlotHighlight>{slotContent}</SlotHighlight>
              <WireBox label="Arama çubuğu" className="h-8" />
              <WireBox label="İlan kartları" className="h-16" />
            </div>
          </div>
        </div>
      );

    case "listing-below-list":
      return (
        <div className="space-y-2 p-3">
          <WireBox label="Header / banner görseli" className="h-12 bg-[#0F2A4A]/20" />
          <div className="grid grid-cols-[72px_1fr] gap-2">
            <WireBox label="Filtre" className="h-24" />
            <div className="space-y-2">
              <WireBox label="Arama + ilan kartları" className="h-16" />
              <WireBox label="Daha fazla yükle" className="h-6" />
              <SlotHighlight>{slotContent}</SlotHighlight>
            </div>
          </div>
        </div>
      );

    case "listing-bottom":
      return (
        <div className="space-y-2 p-3">
          <div className="grid grid-cols-[72px_1fr] gap-2">
            <WireBox label="Filtre" className="h-16" />
            <WireBox label="İlan listesi" className="h-16" />
          </div>
          <WireBox label="Bilgi kutusu" className="h-8" />
          <SlotHighlight>{slotContent}</SlotHighlight>
        </div>
      );

    default:
      return <div className="p-3">{slotContent}</div>;
  }
}

export default function PageContentSlotPreview({
  definition,
  imageUrl,
  imageWidth,
  imageHeight,
}: Props) {
  const uploadedLabel =
    imageWidth && imageHeight ? `Yüklenen görsel: ${imageWidth} × ${imageHeight} px` : null;

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08]">
      <div className="border-b border-white/[0.06] bg-white/[0.03] px-3 py-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-white/50">Sayfada görünüm önizlemesi</p>
        <p className="mt-0.5 text-[10px] text-white/35">{formatDisplayWidth(definition)}</p>
      </div>

      <div className="bg-[#f3f5f8]">
        <PreviewCanvas layout={definition.previewLayout} definition={definition} imageUrl={imageUrl} />
      </div>

      <div className="space-y-1 border-t border-white/[0.06] bg-[#0a1528] px-3 py-2.5 text-[11px] text-[#6a94bc]">
        <p>
          Önerilen tasarım boyutu:{" "}
          <span className="font-bold text-white">{formatRecommendedSize(definition)}</span>
        </p>
        <p className="text-white/45">{definition.recommendedNote}</p>
        {uploadedLabel ? <p className="text-emerald-300/90">{uploadedLabel} — yükseklik sitede buna göre otomatik ayarlanır.</p> : null}
      </div>
    </div>
  );
}
