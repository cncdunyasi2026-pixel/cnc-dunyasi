"use client";

import { useCallback, useEffect, useState } from "react";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import AdminSectionLayout from "@/components/admin/AdminSectionLayout";
import { PAGE_HERO_DEFINITIONS } from "@/lib/constants/pageHeroPages";
import { getPageHeroContent, savePageHeroContent } from "@/services/pageHeroService";
import PageContentEditor from "@/components/admin/PageContentEditor";
import type { PageHeroContent, PageHeroId } from "@/types/pageHero";

type Props = { adminCode: string };

type AdminTab = "headings" | "content";

const COLOR_PRESETS = [
  { label: "Beyaz", value: "#FFFFFF" },
  { label: "Gri mavi", value: "#7A8CA5" },
  { label: "Turuncu", value: "#F26A1B" },
  { label: "Lacivert", value: "#0F2A4A" },
  { label: "Açık mavi", value: "#93C5FD" },
  { label: "Sarı", value: "#FDE68A" },
];

function emptyDraft(): PageHeroContent {
  return {
    eyebrow: "",
    title: "",
    description: "",
    eyebrowColor: "#7A8CA5",
    titleColor: "#FFFFFF",
    descriptionColor: "rgba(255,255,255,0.85)",
  };
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-white/40">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            title={preset.label}
            onClick={() => onChange(preset.value)}
            className={`h-8 w-8 rounded-lg border-2 transition ${
              value === preset.value ? "border-blue-400 scale-110" : "border-white/10 hover:border-white/30"
            }`}
            style={{ backgroundColor: preset.value }}
          />
        ))}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#FFFFFF veya rgba(...)"
        className="mt-2 h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-blue-500/50"
      />
    </div>
  );
}

function HeroPreview({
  content,
  variant,
  image,
}: {
  content: PageHeroContent;
  variant: "home" | "centered";
  image: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
      <div className="relative h-44 sm:h-52">
        <img src={image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[#0F2A4A]/65" />
        <div
          className={`absolute inset-0 flex px-4 py-4 ${
            variant === "home" ? "items-end" : "items-center justify-center text-center"
          }`}
        >
          <div className={variant === "home" ? "max-w-md text-left" : "max-w-lg"}>
            <p className="text-[10px] font-semibold tracking-[0.18em]" style={{ color: content.eyebrowColor }}>
              {content.eyebrow || "Küçük başlık"}
            </p>
            <h3 className="mt-1 text-lg font-extrabold leading-tight sm:text-xl" style={{ color: content.titleColor }}>
              {content.title || "Ana başlık"}
            </h3>
            <p className="mt-1 text-xs sm:text-sm" style={{ color: content.descriptionColor }}>
              {content.description || "Alt içerik metni"}
            </p>
          </div>
        </div>
      </div>
      <p className="bg-white/[0.03] px-3 py-2 text-[11px] text-white/40">Canlı önizleme</p>
    </div>
  );
}

export default function PageManagementScreen({ adminCode }: Props) {
  const [selectedId, setSelectedId] = useState<PageHeroId | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("headings");
  const [draft, setDraft] = useState<PageHeroContent>(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const selected = selectedId ? PAGE_HERO_DEFINITIONS.find((p) => p.id === selectedId) : null;

  const loadPage = useCallback(async (pageId: PageHeroId) => {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const content = await getPageHeroContent(pageId);
      setDraft(content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sayfa içeriği yüklenemedi.");
      setDraft(getPageHeroDefinitionSafe(pageId));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    void loadPage(selectedId);
  }, [selectedId, loadPage]);

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await savePageHeroContent(selectedId, {
        eyebrow: draft.eyebrow.trim(),
        title: draft.title.trim(),
        description: draft.description.trim(),
        eyebrowColor: draft.eyebrowColor.trim(),
        titleColor: draft.titleColor.trim(),
        descriptionColor: draft.descriptionColor.trim(),
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!selectedId) return;
    setDraft(getPageHeroDefinitionSafe(selectedId));
    setSaved(false);
  };

  return (
    <AdminAuthGate adminCode={adminCode}>
      <AdminSectionLayout
        adminCode={adminCode}
        title="Sayfa Yönetimi"
        subtitle="Sayfa başlıkları ve içerik görsellerini düzenleyin"
      >
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sol: sayfa listesi */}
          <div className="space-y-2">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/30">Sayfalar</p>
            {PAGE_HERO_DEFINITIONS.map((page) => {
              const active = selectedId === page.id;
              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(page.id);
                    setActiveTab("headings");
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-blue-500/40 bg-blue-600/15 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]"
                      : "border-white/[0.06] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
                  }`}
                >
                  <p className="text-sm font-bold text-white">{page.label}</p>
                  <p className="mt-0.5 text-[11px] text-white/40">{page.description}</p>
                </button>
              );
            })}
          </div>

          {/* Sağ: düzenleme */}
          {!selected ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
              <div>
                <p className="text-lg font-bold text-white/70">Bir sayfa seçin</p>
                <p className="mt-1 text-sm text-white/40">Soldan düzenlemek istediğiniz sayfaya tıklayın.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("headings")}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    activeTab === "headings"
                      ? "bg-blue-600 text-white"
                      : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  Başlıklar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("content")}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    activeTab === "content"
                      ? "bg-blue-600 text-white"
                      : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  Sayfaya içerik yükle
                </button>
              </div>

              {activeTab === "content" ? (
                <PageContentEditor pageId={selected.id} pageLabel={selected.label} />
              ) : (
                <>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                <h2 className="text-lg font-extrabold text-white">{selected.label}</h2>
                <p className="mt-1 text-sm text-[#6a94bc]">Banner alanındaki üç metin satırını düzenleyin.</p>
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-400/25 bg-rose-950/30 px-4 py-3 text-sm text-rose-300">
                  {error}
                </div>
              ) : null}

              {saved ? (
                <div className="rounded-xl border border-emerald-400/25 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
                  Değişiklikler kaydedildi. Site birkaç dakika içinde güncellenir.
                </div>
              ) : null}

              {loading ? (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-sm text-white/40">
                  Yükleniyor…
                </div>
              ) : (
                <>
                  <HeroPreview content={draft} variant={selected.variant} image={selected.image} />

                  <div className="grid gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 md:grid-cols-2">
                    <div className="space-y-4 md:col-span-2">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-white/40">
                          Küçük başlık
                        </label>
                        <input
                          value={draft.eyebrow}
                          onChange={(e) => setDraft((prev) => ({ ...prev, eyebrow: e.target.value }))}
                          className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-blue-500/50"
                        />
                        <div className="mt-3">
                          <ColorField
                            label="Küçük başlık rengi"
                            value={draft.eyebrowColor}
                            onChange={(value) => setDraft((prev) => ({ ...prev, eyebrowColor: value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-white/40">
                          Ana başlık
                        </label>
                        <input
                          value={draft.title}
                          onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                          className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-blue-500/50"
                        />
                        <div className="mt-3">
                          <ColorField
                            label="Ana başlık rengi"
                            value={draft.titleColor}
                            onChange={(value) => setDraft((prev) => ({ ...prev, titleColor: value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-white/40">
                          Alt içerik
                        </label>
                        <textarea
                          value={draft.description}
                          onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
                        />
                        <div className="mt-3">
                          <ColorField
                            label="Alt içerik rengi"
                            value={draft.descriptionColor}
                            onChange={(value) => setDraft((prev) => ({ ...prev, descriptionColor: value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={saving}
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
                    >
                      {saving ? "Kaydediliyor…" : "Kaydet"}
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={saving}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08] disabled:opacity-50"
                    >
                      Varsayılana dön
                    </button>
                  </div>
                </>
              )}
                </>
              )}
            </div>
          )}
        </div>
      </AdminSectionLayout>
    </AdminAuthGate>
  );
}

function getPageHeroDefinitionSafe(pageId: PageHeroId): PageHeroContent {
  return PAGE_HERO_DEFINITIONS.find((p) => p.id === pageId)?.defaults ?? emptyDraft();
}
