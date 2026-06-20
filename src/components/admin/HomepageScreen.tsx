"use client";

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import AdminSectionLayout from "@/components/admin/AdminSectionLayout";
import { db } from "@/lib/firebase";
import { coerceFirestoreMillis } from "@/lib/firestore/coerceFirestoreMillis";

type Props = { adminCode: string };

/* ── Types ──────────────────────────────────────────────────── */

type FlagField = "isFeatured" | "weeklyDeal";

type ListingItem = {
  id: string;
  collection: string;
  title: string;
  subtitle: string;
  image: string;
  isFeatured: boolean;
  weeklyDeal: boolean;
  createdAt: number;
};

type SectionDef = {
  key: string;
  tabLabel: string;
  icon: string;
  description: string;
  collection: string;
  flagField: FlagField;
  homepageLabel: string;
  recommended: number;
};

/* ── Section config ─────────────────────────────────────────── */

const SECTIONS: SectionDef[] = [
  {
    key: "weekly",
    tabLabel: "Haftanın Fırsatları",
    icon: "💚",
    description: "Anasayfada 'HAFTANIN FIRSATLARI' bölümünde gösterilir.",
    collection: "ads",
    flagField: "weeklyDeal",
    homepageLabel: "Haftanın Fırsatı",
    recommended: 3,
  },
  {
    key: "featured_ads",
    tabLabel: "Öne Çıkan İlanlar",
    icon: "⭐",
    description: "Anasayfada 'ÖNE ÇIKANLAR > İlanlar' bölümünde gösterilir.",
    collection: "ads",
    flagField: "isFeatured",
    homepageLabel: "Öne Çıkan İlan",
    recommended: 4,
  },
  {
    key: "featured_services",
    tabLabel: "Teknik Servisler",
    icon: "⚙️",
    description: "Anasayfada 'ÖNE ÇIKANLAR > Teknik Servisler' bölümünde gösterilir.",
    collection: "technical_service_listings",
    flagField: "isFeatured",
    homepageLabel: "Öne Çıkan Servis",
    recommended: 4,
  },
  {
    key: "featured_parts",
    tabLabel: "Yedek Parça",
    icon: "🔩",
    description: "Anasayfada 'ÖNE ÇIKANLAR > Yedek Parçacılar' bölümünde gösterilir.",
    collection: "spare_part_listings",
    flagField: "isFeatured",
    homepageLabel: "Öne Çıkan Parça",
    recommended: 4,
  },
  {
    key: "featured_jobs",
    tabLabel: "İş İlanları",
    icon: "💼",
    description: "Anasayfada 'ÖNE ÇIKANLAR > İş İlanları' bölümünde gösterilir.",
    collection: "job_listings",
    flagField: "isFeatured",
    homepageLabel: "Öne Çıkan İş İlanı",
    recommended: 4,
  },
];

/* ── Helpers ────────────────────────────────────────────────── */

function mapDoc(d: { id: string; data: () => Record<string, unknown> }, col: string): ListingItem {
  const data = d.data();
  const imgs = Array.isArray(data.images) ? (data.images as string[]) : [];
  const image = imgs[0] ?? "/banner_1.jpg";

  let subtitle = "";
  if (col === "ads") {
    const price = typeof data.price === "number" ? `${data.price.toLocaleString("tr-TR")} ₺` : "";
    const city = typeof data.city === "string" ? data.city : "";
    subtitle = [price, city].filter(Boolean).join(" · ");
  } else if (col === "job_listings") {
    const company = typeof data.company === "string" ? data.company : "";
    const location = typeof data.location === "string" ? data.location : "";
    subtitle = [company, location].filter(Boolean).join(" · ");
  } else {
    const city = typeof data.city === "string" ? data.city : "";
    const name = typeof data.name === "string" ? data.name : "";
    subtitle = [name || city].filter(Boolean).join(" · ");
  }

  return {
    id: d.id,
    collection: col,
    title: typeof data.title === "string" ? data.title : "(Başlık yok)",
    subtitle,
    image,
    isFeatured: data.isFeatured === true,
    weeklyDeal: data.weeklyDeal === true,
    createdAt: data.createdAt != null ? coerceFirestoreMillis(data.createdAt) : 0,
  };
}

/* ── Main Screen ────────────────────────────────────────────── */

export default function HomepageScreen({ adminCode }: Props) {
  const [activeTab, setActiveTab] = useState(SECTIONS[0].key);
  const [allItems, setAllItems] = useState<Record<string, ListingItem[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const currentSection = SECTIONS.find((s) => s.key === activeTab) ?? SECTIONS[0];

  const loadSection = useCallback(
    async (section: SectionDef) => {
      if (allItems[section.key] !== undefined) return; // already loaded
      setLoading((prev) => ({ ...prev, [section.key]: true }));
      try {
        const snap = await getDocs(
          query(
            collection(db, section.collection),
            where("status", "==", "published"),
            orderBy("createdAt", "desc"),
            limit(60),
          ),
        );
        setAllItems((prev) => ({
          ...prev,
          [section.key]: snap.docs.map((d) =>
            mapDoc({ id: d.id, data: () => d.data() as Record<string, unknown> }, section.collection),
          ),
        }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "İlanlar yüklenemedi.");
      } finally {
        setLoading((prev) => ({ ...prev, [section.key]: false }));
      }
    },
    [allItems],
  );

  // Load on tab switch
  useEffect(() => {
    void loadSection(currentSection);
    setSearch("");
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle flag in Firestore
  const toggleFlag = async (item: ListingItem, section: SectionDef) => {
    const currentVal = item[section.flagField];
    const saveKey = `${item.collection}:${item.id}`;
    setSaving(saveKey);
    setError(null);
    try {
      await updateDoc(doc(db, item.collection, item.id), {
        [section.flagField]: !currentVal,
      });
      setAllItems((prev) => ({
        ...prev,
        [section.key]: (prev[section.key] ?? []).map((i) =>
          i.id === item.id ? { ...i, [section.flagField]: !currentVal } : i,
        ),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Güncelleme başarısız.");
    } finally {
      setSaving(null);
    }
  };

  const items = allItems[currentSection.key] ?? [];
  const isLoading = loading[currentSection.key] ?? false;
  const flag = currentSection.flagField;

  const activeItems = items.filter((i) => i[flag]);
  const availableItems = items
    .filter((i) => !i[flag])
    .filter((i) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q);
    });

  return (
    <AdminAuthGate adminCode={adminCode}>
      <AdminSectionLayout
        adminCode={adminCode}
        title="Anasayfa Yönetimi"
        subtitle="Her bölümde hangi ilanların görüneceğini buradan seç."
      >
        <div className="space-y-5">
          {/* ── Section Preview ─────────────────────────── */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#0d1b33] p-4">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-blue-400/60">
              Anasayfa Bölümleri
            </p>
            <p className="text-xs text-[#6a94bc]">
              Her sekme anasayfanın bir bölümüne karşılık gelir. Seçtiğin ilanlar canlıya hemen yansır.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-5">
              {SECTIONS.map((s) => {
                const count = (allItems[s.key] ?? []).filter((i) => i[s.flagField]).length;
                const isActive = activeTab === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setActiveTab(s.key)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 transition ${
                      isActive
                        ? "border-blue-500/60 bg-blue-600/20 text-white"
                        : "border-white/[0.07] text-[#6a94bc] hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <span className="text-xl">{s.icon}</span>
                    <span className="text-[11px] font-semibold leading-tight">{s.tabLabel}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        count > 0
                          ? "bg-emerald-400/15 text-emerald-300"
                          : "bg-white/[0.06] text-white/30"
                      }`}
                    >
                      {count} / {s.recommended}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-400/25 bg-rose-950/30 p-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          {/* ── Active Section Editor ────────────────────── */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#0d1b33]">
            {/* Section header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] p-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentSection.icon}</span>
                  <h2 className="text-lg font-extrabold text-white">
                    {currentSection.tabLabel}
                  </h2>
                  <span className="rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                    {activeItems.length} aktif
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#6a94bc]">{currentSection.description}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-[11px] text-[#6a94bc]">Önerilen</p>
                <p className="text-sm font-bold text-white">{currentSection.recommended} ilan</p>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-2 lg:divide-x lg:divide-white/[0.06]">
              {/* ── Left: Active on homepage ─────────────── */}
              <div className="p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-white">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Şu An Anasayfada
                  <span className="ml-auto text-xs font-normal text-[#6a94bc]">
                    {activeItems.length} ilan
                  </span>
                </h3>

                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
                    ))}
                  </div>
                ) : activeItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/[0.12] p-6 text-center">
                    <p className="text-sm text-[#6a94bc]">Henüz seçili ilan yok.</p>
                    <p className="mt-1 text-xs text-white/25">
                      Sağdan ilan seçerek buraya ekleyin.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeItems.map((item) => {
                      const saveKey = `${item.collection}:${item.id}`;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 rounded-xl border border-emerald-400/15 bg-emerald-900/10 p-2.5"
                        >
                          {/* Thumbnail */}
                          <div className="h-10 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-white/[0.06]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/banner_1.jpg";
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold text-white">
                              {item.title}
                            </p>
                            <p className="truncate text-[11px] text-[#6a94bc]">{item.subtitle}</p>
                          </div>
                          <button
                            type="button"
                            disabled={saving === saveKey}
                            onClick={() => void toggleFlag(item, currentSection)}
                            className="flex-shrink-0 rounded-lg border border-rose-400/25 bg-rose-900/20 px-2.5 py-1 text-[11px] font-bold text-rose-300 transition hover:bg-rose-900/40 disabled:opacity-40"
                          >
                            {saving === saveKey ? "…" : "Kaldır"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Right: Available listings ─────────────── */}
              <div className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white">
                    Yayındaki İlanlar
                  </h3>
                  <span className="ml-auto text-xs font-normal text-[#6a94bc]">
                    {availableItems.length} ilan
                  </span>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="İlan ara..."
                    className="h-9 w-full rounded-xl border border-white/[0.07] bg-white/[0.04] pl-8 pr-3 text-xs text-white placeholder-white/25 outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25"
                  />
                </div>

                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
                    ))}
                  </div>
                ) : availableItems.length === 0 ? (
                  <div className="rounded-xl border border-white/[0.07] p-4 text-center text-sm text-[#6a94bc]">
                    {search ? `"${search}" ile eşleşen ilan bulunamadı.` : "Tüm ilanlar seçili veya yayında ilan yok."}
                  </div>
                ) : (
                  <div className="max-h-[480px] space-y-1.5 overflow-auto pr-1">
                    {availableItems.map((item) => {
                      const saveKey = `${item.collection}:${item.id}`;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#0f1c33] p-2.5 transition hover:bg-[#13264a]"
                        >
                          {/* Thumbnail */}
                          <div className="h-10 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-white/[0.06]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/banner_1.jpg";
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold text-white">
                              {item.title}
                            </p>
                            <p className="truncate text-[11px] text-[#6a94bc]">{item.subtitle}</p>
                          </div>
                          <button
                            type="button"
                            disabled={saving === saveKey}
                            onClick={() => void toggleFlag(item, currentSection)}
                            className="flex-shrink-0 rounded-lg border border-blue-400/25 bg-blue-900/20 px-2.5 py-1 text-[11px] font-bold text-blue-300 transition hover:bg-blue-900/40 disabled:opacity-40"
                          >
                            {saving === saveKey ? "…" : "Ekle"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Info box ────────────────────────────────── */}
          <div className="rounded-xl border border-white/[0.07] bg-[#0a1526] p-4">
            <p className="text-[12px] font-bold text-white/60">💡 Nasıl Çalışır?</p>
            <ul className="mt-2 space-y-1 text-[11px] text-[#6a94bc]">
              <li>• Sağdan ilan seçip <span className="text-blue-300">Ekle</span> butonuna basın → ilan anasayfada görünmeye başlar.</li>
              <li>• Soldaki listeden <span className="text-rose-300">Kaldır</span> butonuna basın → ilan anasayfadan çıkar.</li>
              <li>• Anasayfa her 3 dakikada bir yenilenir (revalidate: 180s).</li>
              <li>• Yeterince seçili ilan yoksa son eklenen yayın ilanlar gösterilir.</li>
            </ul>
          </div>
        </div>
      </AdminSectionLayout>
    </AdminAuthGate>
  );
}
