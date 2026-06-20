"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { MarketplaceProfile } from "@/types/marketplace";
import FavoriteButton from "@/components/ui/FavoriteButton";
import type { FavoriteKind } from "@/services/favoritesService";

type Props = {
  item: MarketplaceProfile;
  listPath: string;
  moderation?: {
    rejectNotes: Record<string, string>;
    onRejectField: (field: { key: string; label: string }) => void;
    onEditField: (field: { key: string; label: string; value: string | number | string[] }) => void;
  };
};

export default function MarketplaceDetailContent({ item, listPath, moderation }: Props) {
  const gallery = useMemo(() => item.images, [item.images]);
  const [selectedImage, setSelectedImage] = useState(gallery[0]);
  const favKind: FavoriteKind = listPath.includes("teknik-servis")
    ? "technical_service_listings"
    : "spare_part_listings";

  const specs = [
    { key: "category", label: "Kategori", value: item.category, editValue: item.category },
    { key: "expertise", label: "Uzmanlik", value: item.expertise, editValue: item.expertise },
    { key: "city", label: "Il", value: item.city, editValue: item.city },
    { key: "district", label: "Ilce", value: item.district, editValue: item.district },
    { key: "yearLabel", label: "Deneyim", value: item.yearLabel },
    { key: "phone", label: "Telefon", value: item.phone, editValue: item.phone },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-[#7A8CA5] sm:text-sm">
        <Link href="/" className="transition hover:text-[#0F2A4A]">
          Anasayfa
        </Link>
        <span>/</span>
        <Link href={listPath} className="transition hover:text-[#0F2A4A]">
          {item.category}
        </Link>
        <span>/</span>
        <span className="line-clamp-1 text-[#0F2A4A]">{item.name}</span>
      </div>

      <div className="mb-3 xl:hidden">
        <h1 className="text-xl font-extrabold leading-tight text-[#0F2A4A] sm:text-2xl">{item.name}</h1>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr_0.75fr]">
        <article className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-[#dbe2ea] bg-white shadow-sm">
            <div className="flex items-center justify-end border-b border-[#e8edf3] px-3 py-2">
              <ActionButtons fieldKey="images" label="Gorseller" editValue={item.images} moderation={moderation} />
            </div>
            <img src={selectedImage} alt={item.name} className="block h-[260px] w-full object-cover sm:h-[380px] lg:h-[460px]" />
          </div>

          <div className="rounded-xl border border-[#dbe2ea] bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wide text-[#7A8CA5]">FOTOGRAF GALERISI</p>
              <ActionButtons fieldKey="images" label="Gorseller" editValue={item.images} moderation={moderation} />
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {gallery.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`overflow-hidden rounded-md border transition ${
                    selectedImage === image ? "border-[#0F2A4A] ring-2 ring-[#0F2A4A]/20" : "border-[#dbe2ea]"
                  }`}
                >
                  <img src={image} alt={`${item.name} gorsel ${index + 1}`} className="h-14 w-full object-cover sm:h-16" />
                </button>
              ))}
            </div>
          </div>
        </article>

        <article className="space-y-3 rounded-xl border border-[#dbe2ea] bg-white p-4 shadow-sm sm:p-5">
          <div className="border-b border-[#e8edf3] pb-3">
            <div className="flex items-start justify-between gap-2">
              <h1 className="hidden text-xl font-extrabold leading-tight text-[#0F2A4A] xl:block xl:text-2xl">{item.name}</h1>
              <ActionButtons fieldKey="name" label="Firma/Servis adi" editValue={item.name} moderation={moderation} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xl font-bold text-[#0F2A4A]">{item.title}</p>
              <ActionButtons fieldKey="title" label="Baslik" editValue={item.title} moderation={moderation} />
            </div>
            <p className="mt-1 text-sm text-[#5f6f86]">
              {item.city} / {item.district}
            </p>
          </div>

          <dl className="divide-y divide-[#eef2f6]">
            {specs.map((spec) => (
              <div key={spec.label} className="grid grid-cols-[1fr_auto] gap-3 py-2.5 text-sm">
                <dt className="font-semibold text-[#61748f]">{spec.label}</dt>
                <dd className="flex items-center justify-end gap-2 text-right font-semibold text-[#0F2A4A]">
                  <span>{spec.value}</span>
                  <ActionButtons
                    fieldKey={spec.key}
                    label={spec.label}
                    editValue={spec.editValue}
                    moderation={moderation}
                  />
                </dd>
              </div>
            ))}
          </dl>
        </article>

        <aside className="space-y-3">
          <div className="rounded-xl border border-[#dbe2ea] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold tracking-wide text-[#7A8CA5]">
              {item.category === "Teknik Servis" ? "SERVIS SAHIBI" : "FIRMA"}
            </p>
            <p className="mt-1 text-lg font-bold text-[#0F2A4A]">{item.name}</p>
            <p className="mt-1 text-xs text-[#7A8CA5]">{item.yearLabel}</p>
            <div className="mt-3 rounded-lg border border-[#e4eaf2] bg-[#f8fafd] p-3 text-center">
              <p className="text-xs font-semibold tracking-wide text-[#7A8CA5]">ILETISIM</p>
              <p className="mt-1 text-lg font-extrabold text-[#0F2A4A]">{item.phone}</p>
            </div>
            <div className="mt-3 space-y-2">
              <button
                type="button"
                className="w-full rounded-lg bg-[#F26A1B] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#d95b14]"
              >
                Mesaj Gonder
              </button>
              <FavoriteButton
                kind={favKind}
                id={item.id}
                slug={item.slug}
                title={item.name}
                image={item.images[0] ?? "/banner_1.jpg"}
                variant="full"
                className="w-full justify-center"
              />
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-4 rounded-xl border border-[#dbe2ea] bg-white p-4 text-sm leading-7 text-[#38506e] shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#0F2A4A] sm:text-lg">Aciklama</h2>
          <ActionButtons fieldKey="description" label="Aciklama" editValue={item.description} moderation={moderation} />
        </div>
        <p className="mt-2">{item.description}</p>
      </div>
    </section>
  );
}

function ActionButtons({
  fieldKey,
  label,
  editValue,
  moderation,
}: {
  fieldKey: string;
  label: string;
  editValue?: string | number | string[];
  moderation?: Props["moderation"];
}) {
  if (!moderation) return null;
  const hasNote = Boolean(moderation.rejectNotes[fieldKey]?.trim());
  return (
    <span className="inline-flex items-center gap-1">
      {editValue !== undefined ? (
        <button
          type="button"
          onClick={() => moderation.onEditField({ key: fieldKey, label, value: editValue })}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-cyan-300 text-[11px] font-bold text-cyan-700"
          title={`${label} alanini duzenle`}
          aria-label={`${label} alanini duzenle`}
        >
          ✎
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => moderation.onRejectField({ key: fieldKey, label })}
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
          hasNote ? "bg-rose-500 text-white" : "border border-[#c7d2e2] text-[#0F2A4A]"
        }`}
        title={`${label} alanini reddet`}
        aria-label={`${label} alanini reddet`}
      >
        ✕
      </button>
    </span>
  );
}
