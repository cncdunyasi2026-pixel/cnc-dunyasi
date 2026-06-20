"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageContentSlotPreview from "@/components/admin/PageContentSlotPreview";
import { useAuth } from "@/hooks/useAuth";
import { getEmptySlotData, getPageContentConfig } from "@/lib/constants/pageContentSlots";
import { formatDisplayWidth, formatRecommendedSize, readImageDimensions } from "@/lib/utils/pageContentSlotUi";
import {
  getPageContentAdminState,
  publishPageContent,
  savePageContentDraft,
  slotsEqual,
} from "@/services/pageContentService";
import { uploadUserImagesWithPaths } from "@/services/storageUpload";
import type { PageContentSlotData, PageContentSlotDefinition, PageContentSlotId, PageContentSlotsMap } from "@/types/pageContent";
import type { PageHeroId } from "@/types/pageHero";

type Props = {
  pageId: PageHeroId;
  pageLabel: string;
};

function SlotEditor({
  pageId,
  definition,
  data,
  published,
  onChange,
}: {
  pageId: PageHeroId;
  definition: PageContentSlotDefinition;
  data: PageContentSlotData;
  published: PageContentSlotData;
  onChange: (next: PageContentSlotData) => void;
}) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDraft =
    data.enabled !== published.enabled ||
    data.imageUrl !== published.imageUrl ||
    data.imagePath !== published.imagePath;

  const handleToggle = () => {
    onChange({ ...data, enabled: !data.enabled });
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length || !user) return;
    setUploading(true);
    setError(null);
    try {
      const file = files[0];
      const dimensions = await readImageDimensions(file);
      const uploaded = await uploadUserImagesWithPaths(
        [file],
        `page-content/${user.uid}/${pageId}/${definition.id}`,
      );
      const image = uploaded[0];
      onChange({
        enabled: true,
        imageUrl: image.url,
        imagePath: image.path,
        imageWidth: dimensions.width,
        imageHeight: dimensions.height,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Görsel yüklenemedi.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange(getEmptySlotData());
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-white/[0.04]"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-white">{definition.label}</p>
            {isDraft ? (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                Taslak
              </span>
            ) : data.enabled && data.imageUrl ? (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                Yayında
              </span>
            ) : (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/40">
                Kapalı
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-white/40">{definition.description}</p>
        </div>
        <svg
          className={`h-5 w-5 flex-shrink-0 text-white/40 transition ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-white/[0.06] px-4 py-4">
          <div className="rounded-xl border border-amber-400/20 bg-amber-950/20 px-3 py-2 text-xs text-amber-200/90">
            Değişiklikler yalnızca taslaktır. Sitede görünmesi için alttaki <strong>Yayınla</strong> butonuna basın.
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#0a1528] px-3 py-2.5 text-xs leading-relaxed text-[#6a94bc]">
            <p>
              Önerilen tasarım boyutu:{" "}
              <span className="font-bold text-white">{formatRecommendedSize(definition)}</span>
            </p>
            <p className="mt-1">
              Sitede görünen genişlik: <span className="text-white/80">{formatDisplayWidth(definition)}</span>
            </p>
            <p className="mt-1 text-white/45">{definition.recommendedNote}</p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Alanı göster (taslak)</p>
              <p className="text-xs text-white/40">Yayınlayana kadar sitede değişmez.</p>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              disabled={!data.imageUrl && !data.enabled}
              className={`relative h-7 w-12 rounded-full transition ${
                data.enabled ? "bg-blue-600" : "bg-white/15"
              } disabled:opacity-40`}
              aria-label={data.enabled ? "Taslakta kapat" : "Taslakta aç"}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${
                  data.enabled ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          <PageContentSlotPreview
            definition={definition}
            imageUrl={data.imageUrl || undefined}
            imageWidth={data.imageWidth}
            imageHeight={data.imageHeight}
          />

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleUpload(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || !user}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {uploading ? "Yükleniyor…" : data.imageUrl ? "Görseli değiştir" : "Görsel yükle"}
            </button>
            {data.imageUrl ? (
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="rounded-xl border border-rose-400/30 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-950/30 disabled:opacity-50"
              >
                Görseli kaldır
              </button>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-400/25 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function PageContentEditor({ pageId, pageLabel }: Props) {
  const config = getPageContentConfig(pageId);
  const [published, setPublished] = useState<Partial<Record<PageContentSlotId, PageContentSlotData>>>({});
  const [draft, setDraft] = useState<Partial<Record<PageContentSlotId, PageContentSlotData>>>({});
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedNotice, setPublishedNotice] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPublishedNotice(false);
    try {
      const state = await getPageContentAdminState(pageId);
      setPublished(state.published);
      setDraft(state.draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "İçerik alanları yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isDirty = useMemo(() => {
    const draftMap = draft as PageContentSlotsMap;
    const publishedMap = published as PageContentSlotsMap;
    return !slotsEqual(pageId, draftMap, publishedMap);
  }, [pageId, draft, published]);

  const persistDraft = useCallback(
    async (nextDraft: Partial<Record<PageContentSlotId, PageContentSlotData>>) => {
      setSavingDraft(true);
      try {
        await savePageContentDraft(pageId, nextDraft as PageContentSlotsMap);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Taslak kaydedilemedi.");
      } finally {
        setSavingDraft(false);
      }
    },
    [pageId],
  );

  const handleSlotChange = (slotId: PageContentSlotId, next: PageContentSlotData) => {
    setDraft((prev) => {
      const updated = { ...prev, [slotId]: next };
      void persistDraft(updated);
      return updated;
    });
    setPublishedNotice(false);
  };

  const handlePublish = async () => {
    const draftMap = draft as PageContentSlotsMap;
    setPublishing(true);
    setError(null);
    setPublishedNotice(false);
    try {
      await publishPageContent(pageId, draftMap);
      setPublished(draft);
      setPublishedNotice(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yayınlanamadı.");
    } finally {
      setPublishing(false);
    }
  };

  const handleRevert = () => {
    setDraft(published);
    void persistDraft(published as PageContentSlotsMap);
    setPublishedNotice(false);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
        <h2 className="text-lg font-extrabold text-white">{pageLabel}</h2>
        <p className="mt-1 text-sm text-[#6a94bc]">
          Görselleri yükleyip düzenleyin; sitede görünmesi için <strong className="text-white">Yayınla</strong>{" "}
          butonuna basın.
        </p>
      </div>

      {isDirty ? (
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-950/40 px-4 py-3">
          <p className="text-sm font-semibold text-amber-200">
            Yayınlanmamış taslak değişiklikler var
            {savingDraft ? " · taslak kaydediliyor…" : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRevert}
              disabled={publishing}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/[0.06] disabled:opacity-50"
            >
              Geri al
            </button>
            <button
              type="button"
              onClick={() => void handlePublish()}
              disabled={publishing}
              className="rounded-xl bg-[#F26A1B] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#dd5f15] disabled:opacity-50"
            >
              {publishing ? "Yayınlanıyor…" : "Yayınla"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-400/25 bg-rose-950/30 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      {publishedNotice ? (
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
          İçerik yayınlandı. Site birkaç dakika içinde güncellenir.
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-sm text-white/40">
          Yükleniyor…
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {config.slots.map((definition) => (
              <SlotEditor
                key={definition.id}
                pageId={pageId}
                definition={definition}
                data={draft[definition.id] ?? getEmptySlotData()}
                published={published[definition.id] ?? getEmptySlotData()}
                onChange={(next) => handleSlotChange(definition.id, next)}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="mr-auto text-xs text-white/40">
              {isDirty
                ? "Taslak hazır — yayınlamak için butona basın."
                : "Tüm alanlar yayındaki sürümle aynı."}
            </p>
            <button
              type="button"
              onClick={handleRevert}
              disabled={!isDirty || publishing}
              className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.06] disabled:opacity-40"
            >
              Geri al
            </button>
            <button
              type="button"
              onClick={() => void handlePublish()}
              disabled={!isDirty || publishing}
              className="rounded-xl bg-[#F26A1B] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#dd5f15] disabled:opacity-40"
            >
              {publishing ? "Yayınlanıyor…" : "Yayınla"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
