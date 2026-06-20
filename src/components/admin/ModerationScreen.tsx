"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import AdminSectionLayout from "@/components/admin/AdminSectionLayout";
import { coerceFirestoreMillis } from "@/lib/firestore/coerceFirestoreMillis";
import { db } from "@/lib/firebase";
import { formatPrice } from "@/lib/utils/format";

type Props = { adminCode: string };

type CollectionName = "ads" | "technical_service_listings" | "spare_part_listings" | "job_listings";
type SectionKey = "new_pending" | "update_pending" | "needs_revision" | "revision_resubmitted" | "archived" | "active";
type PanelKey = `${SectionKey}:${CollectionName}`;

type QueueItem = {
  id: string;
  collectionName: CollectionName;
  title: string;
  city?: string;
  district?: string;
  status?: string;
  price?: number;
  createdAt?: number;
};

const PAGE_SIZE = 10;
const COLLECTIONS: CollectionName[] = ["ads", "technical_service_listings", "spare_part_listings", "job_listings"];
const SECTIONS: SectionKey[] = ["new_pending", "update_pending", "revision_resubmitted", "needs_revision", "archived", "active"];

const SECTION_STATUS_MAP: Record<SectionKey, string[]> = {
  new_pending: ["pending"],
  update_pending: ["update_pending"],
  needs_revision: ["needs_revision"],
  revision_resubmitted: ["revision_resubmitted"],
  archived: ["archived"],
  active: ["published"],
};

const SECTION_META: Record<SectionKey, { title: string; subtitle: string; icon: string; border: string; chip: string; bg: string }> = {
  new_pending: {
    title: "Yeni İlanlar",
    subtitle: "İlk kez onay bekleyen ilanlar",
    icon: "🆕",
    border: "border-amber-400/20",
    chip: "text-amber-300 bg-amber-400/10",
    bg: "bg-[#1a1400]",
  },
  update_pending: {
    title: "Güncelleme Bekleyen",
    subtitle: "Yayındaki ilanı düzenleyip gönderdi — revizyon geçmişi yok",
    icon: "✏️",
    border: "border-sky-400/20",
    chip: "text-sky-300 bg-sky-400/10",
    bg: "bg-[#00111a]",
  },
  revision_resubmitted: {
    title: "Revize Edilip Yeniden Gönderildi",
    subtitle: "Admin revize istedi → kullanıcı düzeltti → tekrar inceleme sırası",
    icon: "🔁",
    border: "border-violet-400/20",
    chip: "text-violet-300 bg-violet-400/10",
    bg: "bg-[#0d0018]",
  },
  needs_revision: {
    title: "Düzeltme Bekleniyor",
    subtitle: "Admin revize istedi — kullanıcı henüz güncellemedi",
    icon: "⚠️",
    border: "border-orange-400/20",
    chip: "text-orange-300 bg-orange-400/10",
    bg: "bg-[#1a0d00]",
  },
  archived: {
    title: "Arşivlenmiş İlanlar",
    subtitle: "Silinmiş ve arşiv durumundaki ilanlar",
    icon: "🗂️",
    border: "border-rose-400/20",
    chip: "text-rose-300 bg-rose-400/10",
    bg: "bg-[#1a0505]",
  },
  active: {
    title: "Aktif İlanlar",
    subtitle: "Şu an yayında olan ilanlar",
    icon: "✅",
    border: "border-emerald-400/20",
    chip: "text-emerald-300 bg-emerald-400/10",
    bg: "bg-[#001a0a]",
  },
};

const COLLECTION_LABELS: Record<CollectionName, string> = {
  ads: "İkinci El CNC",
  technical_service_listings: "Teknik Servis",
  spare_part_listings: "Yedek Parça",
  job_listings: "Kariyer",
};

const COLLECTION_ICONS: Record<CollectionName, string> = {
  ads: "🔧",
  technical_service_listings: "⚙️",
  spare_part_listings: "🔩",
  job_listings: "💼",
};

function panelKey(section: SectionKey, collectionName: CollectionName): PanelKey {
  return `${section}:${collectionName}`;
}

function buildInitialNumberState(value: number) {
  const result = {} as Record<PanelKey, number>;
  for (const section of SECTIONS) {
    for (const name of COLLECTIONS) {
      result[panelKey(section, name)] = value;
    }
  }
  return result;
}

function buildInitialBooleanState(value: boolean) {
  const result = {} as Record<PanelKey, boolean>;
  for (const section of SECTIONS) {
    for (const name of COLLECTIONS) {
      result[panelKey(section, name)] = value;
    }
  }
  return result;
}

function buildInitialItemsState() {
  const result = {} as Record<PanelKey, QueueItem[]>;
  for (const section of SECTIONS) {
    for (const name of COLLECTIONS) {
      result[panelKey(section, name)] = [];
    }
  }
  return result;
}

function fmtDate(ms?: number) {
  if (!ms) return "";
  return new Date(ms).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

export default function ModerationScreen({ adminCode }: Props) {
  const [itemsByPanel, setItemsByPanel] = useState<Record<PanelKey, QueueItem[]>>(buildInitialItemsState);
  const [loadingByPanel, setLoadingByPanel] = useState<Record<PanelKey, boolean>>(() => buildInitialBooleanState(true));
  const [pagesByPanel, setPagesByPanel] = useState<Record<PanelKey, number>>(() => buildInitialNumberState(1));
  const [hasMoreByPanel, setHasMoreByPanel] = useState<Record<PanelKey, boolean>>(() => buildInitialBooleanState(false));
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>("new_pending");

  const fetchPanel = useCallback(async (section: SectionKey, collectionName: CollectionName, page: number) => {
    const key = panelKey(section, collectionName);
    setLoadingByPanel((prev) => ({ ...prev, [key]: true }));
    setError(null);
    try {
      const statuses = SECTION_STATUS_MAP[section];
      const statusFilter =
        statuses.length === 1 ? where("status", "==", statuses[0]) : where("status", "in", statuses);
      const requested = page * PAGE_SIZE;
      const snap = await getDocs(
        query(
          collection(db, collectionName),
          statusFilter,
          orderBy("createdAt", "desc"),
          limit(requested + 1),
        ),
      );
      const mapped = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          collectionName,
          title: typeof data.title === "string" ? data.title : "(Başlık yok)",
          city: typeof data.city === "string" ? data.city : undefined,
          district: typeof data.district === "string" ? data.district : undefined,
          status: typeof data.status === "string" ? data.status : undefined,
          price: typeof data.price === "number" ? data.price : undefined,
          createdAt: data.createdAt != null ? coerceFirestoreMillis(data.createdAt) : undefined,
        } satisfies QueueItem;
      });

      const start = (page - 1) * PAGE_SIZE;
      const end = page * PAGE_SIZE;
      setItemsByPanel((prev) => ({ ...prev, [key]: mapped.slice(start, end) }));
      setHasMoreByPanel((prev) => ({ ...prev, [key]: mapped.length > requested }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Moderasyon listesi yüklenemedi.");
    } finally {
      setLoadingByPanel((prev) => ({ ...prev, [key]: false }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        await Promise.all(
          SECTIONS.flatMap((section) =>
            COLLECTIONS.map((name) => (cancelled ? Promise.resolve() : fetchPanel(section, name, 1))),
          ),
        );
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Moderasyon verisi yüklenemedi.");
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [fetchPanel]);

  const sectionTotals = useMemo(() => {
    const sumBySection = (section: SectionKey) =>
      COLLECTIONS.reduce((sum, name) => sum + itemsByPanel[panelKey(section, name)].length, 0);
    return Object.fromEntries(SECTIONS.map((s) => [s, sumBySection(s)])) as Record<SectionKey, number>;
  }, [itemsByPanel]);

  const handlePageChange = (section: SectionKey, collectionName: CollectionName, page: number) => {
    const key = panelKey(section, collectionName);
    setPagesByPanel((prev) => ({ ...prev, [key]: page }));
    void fetchPanel(section, collectionName, page);
  };

  const isAnyLoading = SECTIONS.some((s) =>
    COLLECTIONS.some((c) => loadingByPanel[panelKey(s, c)]),
  );

  return (
    <AdminAuthGate adminCode={adminCode}>
      <AdminSectionLayout
        adminCode={adminCode}
        title="İlan Moderasyonu"
        subtitle="Durum ve kategori bazlı moderasyon ekranı."
      >
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {(["new_pending", "update_pending", "revision_resubmitted", "needs_revision", "active", "archived"] as SectionKey[]).map((s) => {
              const meta = SECTION_META[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === s ? null : s)}
                  className={`rounded-xl border p-4 text-left transition hover:brightness-125 ${meta.border} ${meta.bg} ${
                    expandedSection === s ? "ring-1 ring-white/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{meta.icon}</span>
                    {expandedSection === s && (
                      <span className="text-[10px] text-white/40">▲ Gizle</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-white/60">{meta.title}</p>
                  <p
                    className={`mt-0.5 text-2xl font-extrabold ${
                      isAnyLoading ? "animate-pulse text-white/20" : "text-white"
                    }`}
                  >
                    {sectionTotals[s]}+
                  </p>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="rounded-xl border border-rose-400/25 bg-rose-950/30 p-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          {/* Sections */}
          <div className="space-y-3">
            {SECTIONS.map((section) => {
              const meta = SECTION_META[section];
              const isExpanded = expandedSection === section;

              return (
                <div
                  key={section}
                  className={`overflow-hidden rounded-2xl border ${meta.border} bg-[#0d1b33]`}
                >
                  {/* Section header */}
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-white/[0.02]"
                    onClick={() => setExpandedSection(isExpanded ? null : section)}
                  >
                    <span className="text-xl">{meta.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-white">{meta.title}</h3>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold border-white/10 ${meta.chip}`}>
                          {sectionTotals[section]} ilan
                        </span>
                      </div>
                      <p className="text-xs text-[#6a94bc]">{meta.subtitle}</p>
                    </div>
                    <span className="text-white/30 transition-transform duration-200" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                      ▼
                    </span>
                  </button>

                  {/* Panel grid */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.06] p-4">
                      <div className="grid gap-3 lg:grid-cols-2">
                        {COLLECTIONS.map((name) => {
                          const key = panelKey(section, name);
                          const items = itemsByPanel[key];
                          const loading = loadingByPanel[key];
                          const currentPage = pagesByPanel[key];
                          const hasMore = hasMoreByPanel[key];
                          return (
                            <CategoryPanel
                              key={key}
                              icon={COLLECTION_ICONS[name]}
                              title={COLLECTION_LABELS[name]}
                              items={items}
                              loading={loading}
                              adminCode={adminCode}
                              currentPage={currentPage}
                              hasMore={hasMore}
                              onPageChange={(page) => handlePageChange(section, name, page)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </AdminSectionLayout>
    </AdminAuthGate>
  );
}

function CategoryPanel({
  icon,
  title,
  items,
  loading,
  adminCode,
  currentPage,
  hasMore,
  onPageChange,
}: {
  icon: string;
  title: string;
  items: QueueItem[];
  loading: boolean;
  adminCode: string;
  currentPage: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
}) {
  const visiblePages = Array.from(
    { length: Math.max(1, currentPage + (hasMore ? 1 : 0)) },
    (_, i) => i + 1,
  );

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0f1c33] p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-extrabold text-white">
          <span>{icon}</span>
          {title}
        </p>
        <span className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] font-bold text-white/40">
          Sayfa {currentPage}
        </span>
      </div>

      {visiblePages.length > 1 && (
        <div className="mb-2.5 flex items-center gap-1">
          {visiblePages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`h-6 min-w-6 rounded-md px-1.5 text-xs font-bold transition ${
                page === currentPage
                  ? "bg-blue-600 text-white"
                  : "border border-white/10 text-white/50 hover:border-white/25 hover:text-white"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/[0.04]" />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <Link
              key={`${item.collectionName}-${item.id}`}
              href={`/${adminCode}/admin/moderasyon/${item.collectionName}/${item.id}`}
              className="group block rounded-lg border border-white/[0.07] bg-[#13264a]/50 p-2.5 text-white transition hover:border-blue-500/40 hover:bg-[#13264a]"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-semibold leading-snug group-hover:text-blue-200">
                  {item.title}
                </p>
                <span className="flex-shrink-0 text-[10px] text-white/30">
                  {fmtDate(item.createdAt)}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {item.status && (
                  <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-white/50">
                    {item.status}
                  </span>
                )}
                {(item.city ?? item.district) && (
                  <span className="text-[11px] text-[#6a94bc]">
                    📍 {[item.city, item.district].filter(Boolean).join(" / ")}
                  </span>
                )}
                {typeof item.price === "number" && (
                  <span className="text-[11px] font-semibold text-white/60">
                    {formatPrice(item.price, (item as {currency?: string}).currency)}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[10px] font-bold text-blue-400/50 transition group-hover:text-blue-400">
                Detaylı inceleme için tıkla →
              </p>
            </Link>
          ))}
          {items.length === 0 && (
            <p className="rounded-lg border border-white/[0.06] p-3 text-xs text-[#6a94bc]">
              Bu kategoride ilan yok.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
