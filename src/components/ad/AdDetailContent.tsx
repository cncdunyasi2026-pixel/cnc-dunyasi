"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Ad } from "@/types/ad";
import { formatPrice } from "@/lib/utils/format";
import { DEFAULT_AD_DESCRIPTION } from "@/lib/constants/adDescription";
import { useAuth } from "@/hooks/useAuth";
import FavoriteButton from "@/components/ui/FavoriteButton";
import ListingMediaLightbox from "@/components/ui/ListingMediaLightbox";
import WatermarkedImage from "@/components/ui/WatermarkedImage";
import { buildAdMediaGallery } from "@/lib/utils/adMediaGallery";
import {
  getOrCreateConversation,
  sendMessage,
} from "@/services/messagingService";

type Props = {
  ad: Ad;
  revisionNotes?: Record<string, string>;
  /** Admin görünümünde kullanıcının değiştirdiği alan anahtarları — mavi "↑ Değişti" badge gösterir. */
  changedFields?: string[];
  moderation?: {
    rejectNotes: Record<string, string>;
    onRejectField?: (field: { key: string; label: string }) => void;
    onEditField?: (field: { key: string; label: string; value: string | number | string[] }) => void;
  };
};

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function AdDetailContent({ ad, revisionNotes = {}, changedFields, moderation }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const isOwnerView = user?.uid === ad.ownerId;
  const [msgLoading, setMsgLoading] = useState(false);

  const handleMessageSeller = async () => {
    if (!user) {
      router.push(`/hesap/giris?redirect=/ilan/${ad.id}`);
      return;
    }
    if (!ad.ownerId) return;
    setMsgLoading(true);
    try {
      const listing = {
        id: ad.id,
        title: ad.title,
        url: `${window.location.origin}/ilan/${ad.id}`,
        imageUrl: ad.images[0],
      };
      const { conversationId, isNew } = await getOrCreateConversation(
        { uid: user.uid, displayName: user.displayName ?? user.email ?? "Kullanıcı" },
        { uid: ad.ownerId, displayName: ad.userName },
        listing,
      );
      if (isNew) {
        await sendMessage(
          conversationId,
          { uid: user.uid, displayName: user.displayName ?? user.email ?? "Kullanıcı" },
          `${window.location.origin}/ilan/${ad.id}`,
          "listing",
        );
      }
      router.push(`/hesap/mesajlar/${conversationId}`);
    } finally {
      setMsgLoading(false);
    }
  };
  const brandValue = ad.brand?.trim() || ad.title.split(" ").slice(0, 2).join(" ");
  const modelValue = ad.model?.trim() || ad.title.split(" ").slice(2).join(" ") || "-";
  const conditionValue = ad.condition?.trim() || "Ekspertiz Onayli";
  const tradeValue = ad.trade?.trim() || "Degerlendirilebilir";
  const deliveryValue = ad.delivery?.trim() || "Hazir";
  const mediaItems = useMemo(() => buildAdMediaGallery(ad), [ad.images, ad.video]);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const selectedMedia = mediaItems[selectedMediaIndex] ?? mediaItems[0];
  const specs = [
    { key: "id", label: "İlan No", value: ad.id.toUpperCase() },
    { key: "createdAt", label: "İlan Tarihi", value: formatDate(ad.createdAt) },
    { key: "category", label: "Kategori", value: ad.category, editValue: ad.category },
    { key: "brand", label: "Marka", value: brandValue, editValue: brandValue },
    { key: "model", label: "Model", value: modelValue, editValue: modelValue === "-" ? "" : modelValue },
    ...(ad.year ? [{ key: "year", label: "Model Yılı", value: String(ad.year) }] : []),
    ...(ad.axisCount ? [{ key: "axisCount", label: "Eksen Sayısı", value: ad.axisCount }] : []),
    { key: "city", label: "İl", value: ad.city, editValue: ad.city },
    { key: "district", label: "İlçe", value: ad.district, editValue: ad.district },
    ...(ad.neighborhood
      ? [{ key: "neighborhood", label: "Mahalle / Köy", value: ad.neighborhood, editValue: ad.neighborhood }]
      : []),
    { key: "condition", label: "Durum", value: conditionValue, editValue: conditionValue },
    ...(ad.sellerType ? [{ key: "sellerType", label: "Kimden", value: ad.sellerType }] : []),
    { key: "trade", label: "Takas", value: tradeValue, editValue: tradeValue },
    { key: "delivery", label: "Teslimat", value: deliveryValue, editValue: deliveryValue },
    { key: "userName", label: "Satıcı", value: ad.userName, editValue: ad.userName },
  ];

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const goNext = () => {
    setLightboxIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const goPrev = () => {
    setLightboxIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-[#7A8CA5] sm:text-sm">
        <Link href="/" className="transition hover:text-[#0F2A4A]">
          Anasayfa
        </Link>
        <span>/</span>
        <Link href="/ilanlar" className="transition hover:text-[#0F2A4A]">
          Ilanlar
        </Link>
        <span>/</span>
        <span className="line-clamp-1 text-[#0F2A4A]">{ad.title}</span>
      </div>

      <div className="mb-3 xl:hidden">
        <h1 className="text-xl font-extrabold leading-tight text-[#0F2A4A] sm:text-2xl">{ad.title}</h1>
      </div>

      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[1.35fr_0.9fr_0.75fr]">
        <article className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-[#dbe2ea] bg-white shadow-sm">
            <div className="flex items-center justify-end border-b border-[#e8edf3] px-3 py-2">
              <ActionButtons fieldKey="images" label="Gorseller" editValue={ad.images} moderation={moderation} isChanged={changedFields?.includes("images")} />
            </div>
            <button
              type="button"
              className="block w-full"
              onClick={() => openLightbox(selectedMediaIndex)}
            >
              {selectedMedia?.type === "video" ? (
                <div className="block h-[260px] w-full bg-black sm:h-[380px] lg:h-[460px]">
                  <video
                    src={selectedMedia.src}
                    controls
                    playsInline
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : selectedMedia ? (
                <WatermarkedImage
                  src={selectedMedia.src}
                  alt={ad.title}
                  className="block h-[260px] w-full object-cover sm:h-[380px] lg:h-[460px]"
                  wrapperClassName="block w-full"
                  watermarkSize="md"
                />
              ) : null}
            </button>
          </div>

          <div className="rounded-xl border border-[#dbe2ea] bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wide text-[#7A8CA5]">FOTOGRAF / VIDEO GALERISI</p>
              <ActionButtons fieldKey="images" label="Gorseller" editValue={ad.images} moderation={moderation} isChanged={changedFields?.includes("images")} />
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {mediaItems.map((item, index) => (
                <button
                  key={`${item.type}-${item.src}-${index}`}
                  type="button"
                  onClick={() => setSelectedMediaIndex(index)}
                  className={`overflow-hidden rounded-md border transition ${
                    selectedMediaIndex === index ? "border-[#0F2A4A] ring-2 ring-[#0F2A4A]/20" : "border-[#dbe2ea]"
                  }`}
                >
                  {item.type === "video" ? (
                    <div className="relative h-14 w-full sm:h-16">
                      <video src={item.src} className="h-full w-full object-cover" muted playsInline />
                      <span className="absolute inset-0 grid place-items-center bg-black/30 text-[10px] font-bold text-white">
                        ▶
                      </span>
                    </div>
                  ) : (
                    <WatermarkedImage
                      src={item.src}
                      alt={`${ad.title} gorsel ${index + 1}`}
                      className="h-14 w-full object-cover sm:h-16"
                      wrapperClassName="h-14 w-full sm:h-16"
                      watermarkSize="sm"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </article>

        <article className="space-y-3 rounded-xl border border-[#dbe2ea] bg-white p-4 shadow-sm sm:p-5">
          <div className="border-b border-[#e8edf3] pb-3">
            <div className="flex items-start justify-between gap-2">
              <h1
                className={`hidden text-xl font-extrabold leading-tight xl:block xl:text-2xl ${
                  revisionNotes.title ? "text-red-700" : changedFields?.includes("title") ? "text-teal-900" : "text-[#0F2A4A]"
                }`}
              >
                {ad.title}
              </h1>
              <ActionButtons fieldKey="title" label="Baslik" editValue={ad.title} moderation={moderation} isChanged={changedFields?.includes("title")} />
            </div>
            {revisionNotes.title ? <p className="mt-1 text-xs font-semibold text-red-700">Admin notu: {revisionNotes.title}</p> : null}
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className={`text-2xl font-extrabold ${revisionNotes.price ? "text-red-700" : changedFields?.includes("price") ? "text-teal-900" : "text-[#0F2A4A]"}`}>
                {formatPrice(ad.price, ad.currency)}
              </p>
              <ActionButtons fieldKey="price" label="Fiyat" editValue={ad.price} moderation={moderation} isChanged={changedFields?.includes("price")} />
            </div>
            {revisionNotes.price ? <p className="mt-1 text-xs font-semibold text-red-700">Admin notu: {revisionNotes.price}</p> : null}
            {isOwnerView && ad.isPaid ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Odeme durumu: Tamamlandi
              </div>
            ) : null}
            {isOwnerView && ad.paymentDueAt ? (
              <p className="mt-2 text-xs font-semibold text-[#61748f]">
                Odeme zamani: {formatDate(ad.paymentDueAt)}
              </p>
            ) : null}
            <p className="mt-1 text-sm text-[#5f6f86]">
              {[ad.city, ad.district, ad.neighborhood].filter(Boolean).join(" / ")}
            </p>
          </div>

          <dl className="divide-y divide-[#eef2f6]">
            {specs.map((item) => {
              const isChanged = changedFields?.includes(item.key);
              return (
                <div
                  key={item.label}
                  className={`border-b border-[#eef2f6] py-2.5 text-sm last:border-b-0 ${
                    isChanged ? "rounded-md bg-teal-50/60" : ""
                  }`}
                >
                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <dt className={`font-semibold ${revisionNotes[item.key] ? "text-red-700" : isChanged ? "text-teal-800" : "text-[#61748f]"}`}>
                      {item.label}
                    </dt>
                    <dd
                      className={`flex items-center justify-end gap-2 break-all text-right font-semibold ${
                        revisionNotes[item.key] ? "text-red-700" : isChanged ? "text-teal-900" : "text-[#0F2A4A]"
                      }`}
                    >
                      <span>{item.value}</span>
                      <ActionButtons
                        fieldKey={item.key}
                        label={item.label}
                        editValue={item.editValue}
                        moderation={moderation}
                        isChanged={isChanged}
                      />
                    </dd>
                  </div>
                  {revisionNotes[item.key] ? (
                    <p className="mt-1 text-xs font-semibold text-red-700">Admin notu: {revisionNotes[item.key]}</p>
                  ) : null}
                </div>
              );
            })}
          </dl>
        </article>

        <aside className="order-4 space-y-3 xl:order-3">
          <div className="rounded-xl border border-[#dbe2ea] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold tracking-wide text-[#7A8CA5]">SATICI</p>
            <p className="mt-1 text-lg font-bold text-[#0F2A4A]">{ad.userName}</p>
            <p className="mt-1 text-xs text-[#7A8CA5]">Hesap Acilis: {formatDate(ad.createdAt)}</p>

            <div className="mt-3 rounded-lg border border-[#e4eaf2] bg-[#f8fafd] p-3 text-center">
              <p className="text-xs font-semibold tracking-wide text-[#7A8CA5]">ILETISIM</p>
              <p className="mt-1 text-lg font-extrabold text-[#0F2A4A]">0 (5XX) XXX XX XX</p>
            </div>

            <div className="mt-3 space-y-2">
              {!isOwnerView && (
                <button
                  type="button"
                  onClick={() => void handleMessageSeller()}
                  disabled={msgLoading}
                  className="w-full rounded-lg bg-[#F26A1B] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#d95b14] disabled:opacity-60"
                >
                  {msgLoading ? "Açılıyor..." : "Mesaj Gönder"}
                </button>
              )}
              <FavoriteButton
                kind="ads"
                id={ad.id}
                slug={ad.id}
                title={ad.title}
                image={ad.images[0] ?? "/banner_1.jpg"}
                variant="full"
                className="w-full justify-center"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#dbe2ea] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold tracking-wide text-[#0F2A4A]">Guvenlik Ipuclari</p>
            <ul className="mt-2 space-y-2 text-xs leading-5 text-[#5f6f86]">
              <li>Odeme islemlerini resmi kanallar uzerinden tamamlayin.</li>
              <li>Makina ekspertiz raporu ve evraklarini mutlaka kontrol edin.</li>
              <li>Fatura ve devir surecini yazili olarak kayit altina alin.</li>
            </ul>
          </div>
        </aside>
        {/* İlan açıklaması — mobilde 3. sıra, desktop'ta 3 kolonu kaplayan alt satır */}
        <div className="order-3 rounded-xl border border-[#dbe2ea] bg-white p-4 text-sm leading-7 text-[#38506e] shadow-sm xl:order-4 xl:col-span-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className={`text-base font-bold sm:text-lg ${revisionNotes.description ? "text-red-700" : changedFields?.includes("description") ? "text-teal-900" : "text-[#0F2A4A]"}`}>
              Ilan Aciklamasi
            </h2>
            <ActionButtons fieldKey="description" label="Aciklama" editValue={ad.description ?? ""} moderation={moderation} isChanged={changedFields?.includes("description")} />
          </div>
          {revisionNotes.description ? (
            <p className="mt-1 text-xs font-semibold text-red-700">Admin notu: {revisionNotes.description}</p>
          ) : null}
          <p className="mt-2">{ad.description?.trim() ? ad.description : DEFAULT_AD_DESCRIPTION}</p>
        </div>

        {/* Tezgah etiketi durumu — sadece ilan sahibi veya admin görür */}
        {(isOwnerView || moderation) && ad.machineLabelMissing !== undefined ? (
          <div className={`order-5 xl:order-5 xl:col-span-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
            ad.machineLabelMissing
              ? "border-[#d3dcea] bg-[#f8fafc] text-[#61748f]"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}>
            <span>{ad.machineLabelMissing ? "ℹ️" : "⚠️"}</span>
            <span>
              {ad.machineLabelMissing
                ? "Satıcı tezgah etiketinin olmadığını beyan etti."
                : "Tezgah etiketi görsele eklenmedi."}
            </span>
          </div>
        ) : null}
      </div>

      <ListingMediaLightbox
        items={mediaItems}
        alt={ad.title}
        isOpen={isLightboxOpen}
        index={lightboxIndex}
        onClose={closeLightbox}
        onPrev={goPrev}
        onNext={goNext}
      />
    </section>
  );
}

function ActionButtons({
  fieldKey,
  label,
  editValue,
  moderation,
  isChanged,
}: {
  fieldKey: string;
  label: string;
  editValue?: string | number | string[];
  moderation?: Props["moderation"];
  isChanged?: boolean;
}) {
  const hasNote = Boolean(moderation?.rejectNotes[fieldKey]?.trim());
  const showAnything = isChanged || moderation;
  if (!showAnything) return null;
  return (
    <span className="inline-flex items-center gap-1 flex-shrink-0">
      {isChanged ? (
        <span
          className="inline-flex items-center gap-0.5 rounded-full bg-teal-500/15 px-1.5 py-0.5 text-[10px] font-bold text-teal-700 ring-1 ring-teal-400/30"
          title="Kullanıcı bu alanı güncelledi"
        >
          ↑ Değişti
        </span>
      ) : null}
      {moderation && editValue !== undefined && moderation.onEditField ? (
        <button
          type="button"
          onClick={() => moderation.onEditField?.({ key: fieldKey, label, value: editValue })}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-cyan-300 text-[11px] font-bold text-cyan-700"
          title={`${label} alanini duzenle`}
          aria-label={`${label} alanini duzenle`}
        >
          ✎
        </button>
      ) : null}
      {moderation?.onRejectField ? (
        <button
          type="button"
          onClick={() => moderation.onRejectField?.({ key: fieldKey, label })}
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            hasNote ? "bg-rose-500 text-white" : "border border-[#c7d2e2] text-[#0F2A4A]"
          }`}
          title={`${label} alanini reddet`}
          aria-label={`${label} alanini reddet`}
        >
          ✕
        </button>
      ) : null}
    </span>
  );
}
