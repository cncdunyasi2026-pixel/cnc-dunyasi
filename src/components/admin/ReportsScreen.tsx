"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  documentId,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import AdminSectionLayout from "@/components/admin/AdminSectionLayout";
import { db } from "@/lib/firebase";
import { coerceFirestoreMillis } from "@/lib/firestore/coerceFirestoreMillis";

type Props = { adminCode: string };

/* ── Types ───────────────────────────────────────────────────── */

type DayPoint = { label: string; dayStart: number; value: number };
type MultiPoint = { label: string; dayStart: number; values: number[] };

type ReportRow = {
  id: string;
  listingType?: string;
  listingId?: string;
  reason?: string;
  reporterId?: string;
  status?: string;
  createdAt: number;
};

type CityRow = { city: string; count: number };

type CategoryStat = {
  key: string;
  label: string;
  icon: string;
  color: string;
  total: number;
  active: number;
  pending: number;
  archived: number;
};

/* ── Constants ───────────────────────────────────────────────── */

const DAYS = 30;

const CATEGORIES = [
  { col: "ads", label: "İkinci El CNC", icon: "🔧", color: "#3b82f6" },
  { col: "technical_service_listings", label: "Teknik Servis", icon: "⚙️", color: "#8b5cf6" },
  { col: "spare_part_listings", label: "Yedek Parça", icon: "🔩", color: "#f59e0b" },
  { col: "job_listings", label: "Kariyer", icon: "💼", color: "#10b981" },
] as const;

const STATUS_META: Record<string, { label: string; color: string }> = {
  open: { label: "Açık", color: "text-amber-300 bg-amber-400/10 border-amber-400/25" },
  in_review: { label: "İnceleniyor", color: "text-blue-300 bg-blue-400/10 border-blue-400/25" },
  resolved: { label: "Çözüldü", color: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25" },
  dismissed: { label: "Reddedildi", color: "text-slate-300 bg-slate-400/10 border-slate-400/25" },
};

const LISTING_TYPE_LABELS: Record<string, string> = {
  ads: "İkinci El CNC",
  technical_service_listings: "Teknik Servis",
  spare_part_listings: "Yedek Parça",
  job_listings: "Kariyer",
};

/* ── Helpers ─────────────────────────────────────────────────── */

function buildBuckets(days: number): { dayStart: number; label: string }[] {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return Array.from({ length: days }).map((_, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (days - 1 - idx));
    d.setHours(0, 0, 0, 0);
    return {
      dayStart: d.getTime(),
      label: d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }),
    };
  });
}

function aggregate(timestamps: number[], buckets: ReturnType<typeof buildBuckets>): DayPoint[] {
  const DAY_MS = 86400000;
  return buckets.map((b) => ({
    label: b.label,
    dayStart: b.dayStart,
    value: timestamps.filter((t) => t >= b.dayStart && t < b.dayStart + DAY_MS).length,
  }));
}

function toMs(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  return coerceFirestoreMillis(value);
}

/** YYYY-MM-DD — yerel saat dilimine göre */
function dayStr(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

function fmtDate(ms: number) {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(ms: number) {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  return fmtDate(ms);
}

/* ── Main Component ──────────────────────────────────────────── */

export default function ReportsScreen({ adminCode }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Traffic
  const [trafficSeries, setTrafficSeries] = useState<DayPoint[]>([]);
  // Users
  const [userSeries, setUserSeries] = useState<DayPoint[]>([]);
  // Per-category new listing series
  const [listingSeries, setListingSeries] = useState<MultiPoint[]>([]);
  // Category stats
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  // Status totals
  const [statusTotals, setStatusTotals] = useState({ active: 0, pending: 0, revision: 0, archived: 0 });
  // City distribution
  const [cityRows, setCityRows] = useState<CityRow[]>([]);
  // Reports
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reportFilter, setReportFilter] = useState("all");

  const buckets = useMemo(() => buildBuckets(DAYS), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fromMs = buckets[0].dayStart;
      const fromTs = Timestamp.fromMillis(fromMs);

      /* ── 1. Parallel fetches ─────────────────────────────── */
      const [
        trafficSnap,
        userSnap,
        reportsSnap,
        ...rest
      ] = await Promise.all([
        /*
         * Günlük trafik aggregate — listing_click_events yerine.
         * 30 gün için max 30 belge okunur (eski yöntem: 10.000 belge).
         */
        getDocs(
          query(
            collection(db, "analytics_daily"),
            where(documentId(), ">=", dayStr(fromMs)),
            where(documentId(), "<=", dayStr(Date.now())),
          ),
        ),
        /* New users */
        getDocs(
          query(
            collection(db, "users"),
            where("createdAt", ">=", fromTs),
            orderBy("createdAt", "asc"),
            limit(5000),
          ),
        ),
        /* Reports */
        getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(100))),
        /* New listings per category */
        ...CATEGORIES.map(({ col }) =>
          getDocs(
            query(
              collection(db, col),
              where("createdAt", ">=", fromTs),
              orderBy("createdAt", "asc"),
              limit(3000),
            ),
          ),
        ),
        /* Category count stats */
        ...CATEGORIES.flatMap(({ col }) => [
          getCountFromServer(collection(db, col)),
          getCountFromServer(query(collection(db, col), where("status", "==", "published"))),
          getCountFromServer(query(collection(db, col), where("status", "==", "pending"))),
          getCountFromServer(query(collection(db, col), where("status", "==", "archived"))),
          getCountFromServer(query(collection(db, col), where("status", "==", "needs_revision"))),
          getCountFromServer(query(collection(db, col), where("status", "==", "update_pending"))),
        ]),
        /* Published ads for city distribution */
        getDocs(
          query(
            collection(db, "ads"),
            where("status", "==", "published"),
            limit(2000),
          ),
        ),
      ]);

      /* ── 2. Parse category listing snaps ─────────────────── */
      const catSnaps = rest.slice(0, CATEGORIES.length) as typeof trafficSnap[];
      const countSnaps = rest.slice(CATEGORIES.length, CATEGORIES.length + CATEGORIES.length * 6);
      const cityAdsSnap = rest[rest.length - 1] as typeof trafficSnap;

      /* ── 3. Traffic series ───────────────────────────────── */
      // analytics_daily belgelerinden: her belge 1 güne karşılık gelir.
      // Belge ID'si "YYYY-MM-DD", içinde clicks: number.
      const dailyClickMap = new Map<string, number>(
        trafficSnap.docs.map((d) => [d.id, (d.data().clicks as number) ?? 0]),
      );
      setTrafficSeries(
        buckets.map((b) => ({
          label: b.label,
          dayStart: b.dayStart,
          value: dailyClickMap.get(dayStr(b.dayStart)) ?? 0,
        })),
      );

      /* ── 4. User series ──────────────────────────────────── */
      setUserSeries(
        aggregate(userSnap.docs.map((d) => toMs((d.data() as Record<string, unknown>).createdAt)), buckets),
      );

      /* ── 5. Multi-series listing chart ───────────────────── */
      const DAY_MS = 86400000;
      const multiPoints: MultiPoint[] = buckets.map((b) => ({
        label: b.label,
        dayStart: b.dayStart,
        values: catSnaps.map((snap) =>
          snap.docs.filter((d) => {
            const t = toMs((d.data() as Record<string, unknown>).createdAt);
            return t >= b.dayStart && t < b.dayStart + DAY_MS;
          }).length,
        ),
      }));
      setListingSeries(multiPoints);

      /* ── 6. Category stats ───────────────────────────────── */
      const catStats: CategoryStat[] = CATEGORIES.map((cat, idx) => {
        const base = idx * 6;
        const getCount = (offset: number) =>
          (countSnaps[base + offset] as Awaited<ReturnType<typeof getCountFromServer>>).data().count;
        return {
          key: cat.col,
          label: cat.label,
          icon: cat.icon,
          color: cat.color,
          total: getCount(0),
          active: getCount(1),
          pending: getCount(2) + getCount(5),
          archived: getCount(3),
        };
      });
      setCategoryStats(catStats);
      setStatusTotals({
        active: catStats.reduce((s, c) => s + c.active, 0),
        pending: catStats.reduce((s, c) => s + c.pending, 0),
        revision: catStats.reduce((s, c) => s + c.archived, 0),
        archived: catStats.reduce((s, c) => s + c.archived, 0),
      });

      /* ── 7. City distribution ────────────────────────────── */
      const cityMap: Record<string, number> = {};
      cityAdsSnap.docs.forEach((d) => {
        const city = (d.data() as Record<string, unknown>).city;
        if (typeof city === "string" && city.trim()) {
          const key = city.trim();
          cityMap[key] = (cityMap[key] ?? 0) + 1;
        }
      });
      const topCities = Object.entries(cityMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([city, count]) => ({ city, count }));
      setCityRows(topCities);

      /* ── 8. Reports ──────────────────────────────────────── */
      setReports(
        reportsSnap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            listingType: typeof data.listingType === "string" ? data.listingType : undefined,
            listingId: typeof data.listingId === "string" ? data.listingId : undefined,
            reason: typeof data.reason === "string" ? data.reason : undefined,
            reporterId: typeof data.reporterId === "string" ? data.reporterId : undefined,
            status: typeof data.status === "string" ? data.status : undefined,
            createdAt: data.createdAt != null ? toMs(data.createdAt) : 0,
          } satisfies ReportRow;
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Veriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [buckets]);

  useEffect(() => {
    void load();
  }, [load]);

  /* ── Derived values ──────────────────────────────────────── */
  const trafficTotal = useMemo(() => trafficSeries.reduce((s, d) => s + d.value, 0), [trafficSeries]);
  const trafficPeak = useMemo(() => Math.max(0, ...trafficSeries.map((d) => d.value)), [trafficSeries]);
  const trafficAvg = useMemo(
    () => (trafficSeries.length ? Math.round(trafficTotal / trafficSeries.length) : 0),
    [trafficTotal, trafficSeries],
  );
  const userTotal = useMemo(() => userSeries.reduce((s, d) => s + d.value, 0), [userSeries]);
  const openReports = useMemo(() => reports.filter((r) => r.status === "open").length, [reports]);

  const filteredReports = useMemo(
    () => (reportFilter === "all" ? reports : reports.filter((r) => r.status === reportFilter)),
    [reports, reportFilter],
  );

  const updateReportStatus = async (row: ReportRow, status: string) => {
    setSavingId(row.id);
    try {
      await updateDoc(doc(db, "reports", row.id), { status, updatedAt: serverTimestamp() });
      await addDoc(collection(db, "audit_logs"), {
        action: "report_status_update",
        reportId: row.id,
        listingType: row.listingType ?? null,
        listingId: row.listingId ?? null,
        status,
        createdAt: serverTimestamp(),
      });
      setReports((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminAuthGate adminCode={adminCode}>
      <AdminSectionLayout
        adminCode={adminCode}
        title="Raporlar & Analitik"
        subtitle="Platform verilerinden üretilen canlı istatistikler ve analizler."
      >
        <div className="space-y-8">
          {error && (
            <div className="rounded-xl border border-rose-400/25 bg-rose-950/30 p-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          {/* ── 1. KPI Cards ─────────────────────────────── */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              loading={loading}
              icon="📊"
              label="Trafik (Son 30 Gün)"
              value={trafficTotal.toLocaleString("tr-TR")}
              sub={`Ort. ${trafficAvg}/gün · En yüksek: ${trafficPeak}`}
              accent="blue"
            />
            <KpiCard
              loading={loading}
              icon="📋"
              label="Toplam Aktif İlan"
              value={statusTotals.active.toLocaleString("tr-TR")}
              sub={`${statusTotals.pending} bekleyen moderasyon`}
              accent="emerald"
            />
            <KpiCard
              loading={loading}
              icon="👤"
              label="Yeni Kullanıcı (30 Gün)"
              value={userTotal.toLocaleString("tr-TR")}
              sub={`Ort. ${userSeries.length ? Math.round(userTotal / userSeries.length) : 0}/gün`}
              accent="purple"
            />
            <KpiCard
              loading={loading}
              icon="🚩"
              label="Açık Rapor"
              value={openReports.toLocaleString("tr-TR")}
              sub={`${reports.length} toplam rapor`}
              accent={openReports > 0 ? "amber" : "slate"}
            />
          </div>

          {/* ── 2. Traffic Chart ─────────────────────────── */}
          <Section title="Trafik Analizi" subtitle="Son 30 günlük ilan tıklanma verisi" icon="📈">
            <LineChart
              loading={loading}
              series={[{ label: "Tıklanma", data: trafficSeries.map((d) => d.value), color: "#3b82f6" }]}
              labels={trafficSeries.map((d) => d.label)}
              height={180}
            />
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                { label: "Toplam", value: trafficTotal.toLocaleString("tr-TR"), color: "text-blue-300" },
                { label: "Günlük Ortalama", value: trafficAvg.toLocaleString("tr-TR"), color: "text-white" },
                { label: "En Yüksek Gün", value: trafficPeak.toLocaleString("tr-TR"), color: "text-amber-300" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/[0.07] bg-[#0a1526] px-4 py-3 text-center">
                  <p className={`text-xl font-extrabold ${s.color}`}>{loading ? "—" : s.value}</p>
                  <p className="mt-0.5 text-[11px] text-[#6a94bc]">{s.label}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 3. Listing + User growth charts ──────────── */}
          <div className="grid gap-6 xl:grid-cols-2">
            <Section title="Yeni İlan Kaydı" subtitle="Son 30 gün, kategoriye göre" icon="📦">
              <MultiLineChart
                loading={loading}
                series={listingSeries}
                categories={CATEGORIES.map((c) => ({ label: c.label, color: c.color }))}
                height={160}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {CATEGORIES.map((c, idx) => {
                  const total = listingSeries.reduce((s, p) => s + (p.values[idx] ?? 0), 0);
                  return (
                    <div
                      key={c.col}
                      className="flex items-center gap-1.5 rounded-full border border-white/[0.07] px-3 py-1"
                    >
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-[11px] text-[#6a94bc]">{c.icon} {c.label}</span>
                      <span className="text-[11px] font-bold text-white">{loading ? "—" : total}</span>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section title="Kullanıcı Büyümesi" subtitle="Son 30 gün, yeni kayıtlar" icon="👥">
              <LineChart
                loading={loading}
                series={[{ label: "Yeni Üye", data: userSeries.map((d) => d.value), color: "#8b5cf6" }]}
                labels={userSeries.map((d) => d.label)}
                height={160}
              />
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[
                  { label: "Toplam Yeni Üye", value: userTotal },
                  { label: "Günlük Ortalama", value: userSeries.length ? Math.round(userTotal / userSeries.length) : 0 },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/[0.07] bg-[#0a1526] px-4 py-3 text-center">
                    <p className="text-2xl font-extrabold text-purple-300">{loading ? "—" : s.value}</p>
                    <p className="mt-0.5 text-[11px] text-[#6a94bc]">{s.label}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* ── 4. Category breakdown + Status pie ───────── */}
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Category table */}
            <Section title="Kategori Dağılımı" subtitle="Tüm zamanlar, yayında / bekleyen / arşiv" icon="📂">
              <div className="space-y-2">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
                    ))
                  : categoryStats.map((c) => {
                      const pct = c.total > 0 ? Math.round((c.active / c.total) * 100) : 0;
                      return (
                        <div
                          key={c.key}
                          className="rounded-xl border border-white/[0.07] bg-[#0f1c33] p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2 font-semibold text-white">
                              <span>{c.icon}</span>
                              {c.label}
                            </span>
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-emerald-300">{c.active} aktif</span>
                              {c.pending > 0 && (
                                <span className="text-amber-300">{c.pending} bekl.</span>
                              )}
                              <span className="text-white/30">{c.total} toplam</span>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: c.color }}
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-white/30">{pct}% yayında</p>
                        </div>
                      );
                    })}
              </div>
            </Section>

            {/* Status donut / rings */}
            <Section title="İlan Durumu Dağılımı" subtitle="Tüm kategoriler, toplam" icon="🥧">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-40 w-40 animate-pulse rounded-full bg-white/[0.04]" />
                </div>
              ) : (
                <StatusRings stats={categoryStats} />
              )}
            </Section>
          </div>

          {/* ── 5. City Distribution ─────────────────────── */}
          <Section title="Şehir Dağılımı" subtitle="Yayındaki ilanların şehirlere göre dağılımı" icon="📍">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-8 animate-pulse rounded-xl bg-white/[0.04]" />
                ))}
              </div>
            ) : cityRows.length === 0 ? (
              <p className="py-4 text-sm text-[#6a94bc]">Şehir verisi bulunamadı.</p>
            ) : (
              <HorizontalBarChart rows={cityRows} />
            )}
          </Section>

          {/* ── 6. Reports Table ─────────────────────────── */}
          <Section
            title="Kullanıcı Bildirimleri"
            subtitle="Kullanıcıların bildirdiği içerikler ve moderasyon işlemleri"
            icon="🚩"
          >
            {/* Filter */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {["all", "open", "in_review", "resolved", "dismissed"].map((s) => {
                const count = s === "all" ? reports.length : reports.filter((r) => r.status === s).length;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReportFilter(s)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-bold transition ${
                      reportFilter === s
                        ? "border-blue-500/50 bg-blue-600/20 text-blue-300"
                        : "border-white/[0.07] text-white/40 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    {s === "all" ? "Tümü" : STATUS_META[s]?.label ?? s}{" "}
                    <span className="opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl border border-white/[0.07] bg-[#0f1c33]" />
                ))
              ) : filteredReports.length === 0 ? (
                <div className="rounded-xl border border-white/[0.07] bg-[#0f1c33] py-10 text-center text-sm text-[#6a94bc]">
                  Bu durumda bildirim yok.
                </div>
              ) : (
                filteredReports.map((row) => {
                  const sm = row.status ? STATUS_META[row.status] : undefined;
                  return (
                    <div
                      key={row.id}
                      className="rounded-xl border border-white/[0.07] bg-[#0f1c33] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-white">{row.reason ?? "Bildirim"}</p>
                            {sm && (
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${sm.color}`}>
                                {sm.label}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[12px] text-[#6a94bc]">
                            {row.listingType && (
                              <span>
                                Kategori:{" "}
                                <span className="text-white/60">
                                  {LISTING_TYPE_LABELS[row.listingType] ?? row.listingType}
                                </span>
                              </span>
                            )}
                            {row.listingId && (
                              <span>
                                İlan:{" "}
                                <code className="rounded bg-white/[0.06] px-1 text-[11px] text-white/50">
                                  {row.listingId.slice(0, 12)}…
                                </code>
                              </span>
                            )}
                            {row.reporterId && (
                              <span>
                                Bildiren:{" "}
                                <code className="rounded bg-white/[0.06] px-1 text-[11px] text-white/50">
                                  {row.reporterId.slice(0, 12)}…
                                </code>
                              </span>
                            )}
                            {row.createdAt > 0 && (
                              <span className="text-white/30">{timeAgo(row.createdAt)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 flex-wrap gap-1.5">
                          {row.status !== "in_review" && (
                            <button
                              type="button"
                              disabled={savingId === row.id}
                              onClick={() => void updateReportStatus(row, "in_review")}
                              className="rounded-lg border border-blue-400/25 bg-blue-900/20 px-3 py-1.5 text-[11px] font-bold text-blue-300 transition hover:bg-blue-900/40 disabled:opacity-40"
                            >
                              İncele
                            </button>
                          )}
                          {row.status !== "resolved" && (
                            <button
                              type="button"
                              disabled={savingId === row.id}
                              onClick={() => void updateReportStatus(row, "resolved")}
                              className="rounded-lg border border-emerald-400/25 bg-emerald-900/20 px-3 py-1.5 text-[11px] font-bold text-emerald-300 transition hover:bg-emerald-900/40 disabled:opacity-40"
                            >
                              Çözüldü
                            </button>
                          )}
                          {row.status !== "dismissed" && (
                            <button
                              type="button"
                              disabled={savingId === row.id}
                              onClick={() => void updateReportStatus(row, "dismissed")}
                              className="rounded-lg border border-white/[0.07] px-3 py-1.5 text-[11px] font-bold text-white/40 transition hover:border-white/20 hover:text-white/60 disabled:opacity-40"
                            >
                              Reddet
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Section>
        </div>
      </AdminSectionLayout>
    </AdminAuthGate>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function Section({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="flex items-center gap-2 font-extrabold text-white">
          {icon && <span>{icon}</span>}
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-[12px] text-[#6a94bc]">{subtitle}</p>}
      </div>
      <div className="rounded-2xl border border-white/[0.07] bg-[#0d1b33] p-4">{children}</div>
    </div>
  );
}

type AccentColor = "blue" | "emerald" | "purple" | "amber" | "slate";

function KpiCard({
  loading,
  icon,
  label,
  value,
  sub,
  accent,
}: {
  loading: boolean;
  icon: string;
  label: string;
  value: string;
  sub: string;
  accent: AccentColor;
}) {
  const map: Record<AccentColor, string> = {
    blue: "border-blue-500/20 from-[#0d1c38] to-[#0a1628]",
    emerald: "border-emerald-500/20 from-[#0d2420] to-[#0a1628]",
    purple: "border-purple-500/20 from-[#1a0d2e] to-[#0a1628]",
    amber: "border-amber-500/20 from-[#231b0a] to-[#0a1628]",
    slate: "border-white/[0.07] from-[#0f1c33] to-[#0a1628]",
  };
  const valColor: Record<AccentColor, string> = {
    blue: "text-blue-100",
    emerald: "text-emerald-100",
    purple: "text-purple-100",
    amber: "text-amber-100",
    slate: "text-white",
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${map[accent]}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-[#6a94bc]">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      {loading ? (
        <div className="mt-2 h-8 w-24 animate-pulse rounded bg-white/10" />
      ) : (
        <p className={`mt-2 text-3xl font-extrabold ${valColor[accent]}`}>{value}</p>
      )}
      <p className="mt-1 text-[11px] text-[#4a6a8a]">{sub}</p>
    </div>
  );
}

/* ── SVG smooth path helper ──────────────────────────────────── */

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C ${cpx} ${pts[i - 1].y} ${cpx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
  }
  return d;
}

/* ── Line Chart (single series) ──────────────────────────────── */

function LineChart({
  loading,
  series,
  labels,
  height,
}: {
  loading: boolean;
  series: { label: string; data: number[]; color: string }[];
  labels: string[];
  height: number;
}) {
  const [hovIdx, setHovIdx] = useState<number | null>(null);

  const data = series[0]?.data ?? [];
  const color = series[0]?.color ?? "#3b82f6";
  const max = Math.max(1, ...data);

  const VW = 800;
  const VH = 180;
  const PAD = { t: 16, r: 12, b: 28, l: 12 };
  const CW = VW - PAD.l - PAD.r;
  const CH = VH - PAD.t - PAD.b;

  const xOf = (i: number) => PAD.l + (data.length > 1 ? (i / (data.length - 1)) : 0.5) * CW;
  const yOf = (v: number) => PAD.t + CH - (v / max) * CH;

  const pts = data.map((v, i) => ({ x: xOf(i), y: yOf(v), v }));
  const linePath = smoothPath(pts);
  const areaPath =
    pts.length > 0
      ? `${linePath} L ${xOf(data.length - 1)} ${PAD.t + CH} L ${xOf(0)} ${PAD.t + CH} Z`
      : "";

  const gradId = `lg-${color.replace("#", "")}`;
  const labelStep = Math.max(1, Math.ceil(labels.length / 7));

  if (loading) {
    return <div className="animate-pulse rounded-xl bg-white/[0.04]" style={{ height }} />;
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full overflow-visible"
        style={{ height }}
        onMouseLeave={() => setHovIdx(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width={VW} height={VH - PAD.b} rx="8" fill="#07112a" />

        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={PAD.l} x2={VW - PAD.r}
            y1={PAD.t + CH - f * CH} y2={PAD.t + CH - f * CH}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}

        {/* Line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Hover vertical line */}
        {hovIdx !== null && pts[hovIdx] && (
          <line
            x1={pts[hovIdx].x} x2={pts[hovIdx].x}
            y1={PAD.t} y2={PAD.t + CH}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        )}

        {/* Dots + invisible hit areas */}
        {pts.map((p, i) => (
          <g key={i}>
            {/* Invisible hover target */}
            <rect
              x={i === 0 ? PAD.l : (pts[i - 1].x + p.x) / 2}
              y={PAD.t}
              width={
                i === 0
                  ? (pts[1] ? (pts[1].x - p.x) / 2 : CW)
                  : i === pts.length - 1
                  ? (p.x - (pts[i - 1].x + p.x) / 2)
                  : (pts[i + 1].x - pts[i - 1].x) / 2
              }
              height={CH}
              fill="transparent"
              onMouseEnter={() => setHovIdx(i)}
            />
            {/* Dot */}
            <circle
              cx={p.x} cy={p.y}
              r={hovIdx === i ? 5 : 3}
              fill={hovIdx === i ? "#fff" : color}
              stroke={color}
              strokeWidth={hovIdx === i ? 2 : 0}
              style={{ transition: "r 0.1s, fill 0.1s" }}
            />
          </g>
        ))}

        {/* Tooltip */}
        {hovIdx !== null && pts[hovIdx] && (() => {
          const p = pts[hovIdx];
          const label = labels[hovIdx] ?? "";
          const text = `${label}: ${p.v}`;
          const boxW = text.length * 6.5 + 16;
          const bx = Math.min(Math.max(p.x - boxW / 2, PAD.l), VW - PAD.r - boxW);
          const by = Math.max(p.y - 34, PAD.t);
          return (
            <g>
              <rect x={bx} y={by} width={boxW} height={22} rx="5" fill="rgba(0,0,0,0.85)" />
              <text x={bx + boxW / 2} y={by + 14} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">
                {text}
              </text>
            </g>
          );
        })()}

        {/* X axis labels */}
        {labels.map((l, i) => {
          if (i % labelStep !== 0 && i !== labels.length - 1) return null;
          return (
            <text key={i} x={xOf(i)} y={VH - 5} textAnchor="middle" fill="rgba(255,255,255,0.22)" fontSize="9">
              {l}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Multi-series Line Chart ─────────────────────────────────── */

function MultiLineChart({
  loading,
  series,
  categories,
  height,
}: {
  loading: boolean;
  series: MultiPoint[];
  categories: { label: string; color: string }[];
  height: number;
}) {
  const [hovIdx, setHovIdx] = useState<number | null>(null);

  const maxVal = Math.max(
    1,
    ...series.flatMap((p) => p.values),
  );

  const VW = 800;
  const VH = 180;
  const PAD = { t: 16, r: 12, b: 28, l: 12 };
  const CW = VW - PAD.l - PAD.r;
  const CH = VH - PAD.t - PAD.b;

  const xOf = (i: number) => PAD.l + (series.length > 1 ? (i / (series.length - 1)) : 0.5) * CW;
  const yOf = (v: number) => PAD.t + CH - (v / maxVal) * CH;

  const labelStep = Math.max(1, Math.ceil(series.length / 7));

  if (loading) {
    return <div className="animate-pulse rounded-xl bg-white/[0.04]" style={{ height }} />;
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full overflow-visible"
        style={{ height }}
        onMouseLeave={() => setHovIdx(null)}
      >
        <defs>
          {categories.map((cat) => {
            const id = `mlg-${cat.color.replace("#", "")}`;
            return (
              <linearGradient key={id} id={id} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={cat.color} stopOpacity="0.20" />
                <stop offset="100%" stopColor={cat.color} stopOpacity="0.01" />
              </linearGradient>
            );
          })}
        </defs>

        {/* Background */}
        <rect x="0" y="0" width={VW} height={VH - PAD.b} rx="8" fill="#07112a" />

        {/* Grid */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={PAD.l} x2={VW - PAD.r}
            y1={PAD.t + CH - f * CH} y2={PAD.t + CH - f * CH}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1"
          />
        ))}

        {/* Area + Lines per category */}
        {categories.map((cat, ci) => {
          const pts = series.map((p, i) => ({ x: xOf(i), y: yOf(p.values[ci] ?? 0) }));
          const lp = smoothPath(pts);
          const ap =
            pts.length > 0
              ? `${lp} L ${xOf(series.length - 1)} ${PAD.t + CH} L ${xOf(0)} ${PAD.t + CH} Z`
              : "";
          const gradId = `mlg-${cat.color.replace("#", "")}`;
          return (
            <g key={ci}>
              {ap && <path d={ap} fill={`url(#${gradId})`} />}
              {lp && (
                <path
                  d={lp}
                  fill="none"
                  stroke={cat.color}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                />
              )}
            </g>
          );
        })}

        {/* Hover vertical line */}
        {hovIdx !== null && (
          <line
            x1={xOf(hovIdx)} x2={xOf(hovIdx)}
            y1={PAD.t} y2={PAD.t + CH}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        )}

        {/* Invisible hit rects */}
        {series.map((_, i) => (
          <rect
            key={i}
            x={i === 0 ? PAD.l : (xOf(i - 1) + xOf(i)) / 2}
            y={PAD.t}
            width={
              series.length === 1
                ? CW
                : i === 0
                ? (xOf(1) - PAD.l) / 2 + (xOf(1) - xOf(0)) / 2
                : i === series.length - 1
                ? (xOf(i) - (xOf(i - 1) + xOf(i)) / 2)
                : (xOf(i + 1) - xOf(i - 1)) / 2
            }
            height={CH}
            fill="transparent"
            onMouseEnter={() => setHovIdx(i)}
          />
        ))}

        {/* Hover dots */}
        {hovIdx !== null &&
          categories.map((cat, ci) => {
            const v = series[hovIdx]?.values[ci] ?? 0;
            return (
              <circle
                key={ci}
                cx={xOf(hovIdx)}
                cy={yOf(v)}
                r="4"
                fill="#fff"
                stroke={cat.color}
                strokeWidth="2"
              />
            );
          })}

        {/* Tooltip on hover */}
        {hovIdx !== null && (() => {
          const point = series[hovIdx];
          const total = point.values.reduce((s, v) => s + v, 0);
          const lines = [`${point.label} · Toplam: ${total}`, ...categories.map((c, ci) => `${c.label}: ${point.values[ci] ?? 0}`)];
          const boxW = Math.max(...lines.map((l) => l.length)) * 6.2 + 20;
          const boxH = lines.length * 14 + 12;
          const bx = Math.min(Math.max(xOf(hovIdx) - boxW / 2, PAD.l), VW - PAD.r - boxW);
          const by = Math.max(PAD.t + 4, PAD.t);
          return (
            <g>
              <rect x={bx} y={by} width={boxW} height={boxH} rx="5" fill="rgba(0,0,0,0.88)" />
              {lines.map((line, li) => (
                <text key={li} x={bx + 10} y={by + 14 + li * 14} fill={li === 0 ? "white" : categories[li - 1]?.color ?? "white"} fontSize="10" fontWeight={li === 0 ? "700" : "600"}>
                  {line}
                </text>
              ))}
            </g>
          );
        })()}

        {/* X axis labels */}
        {series.map((p, i) => {
          if (i % labelStep !== 0 && i !== series.length - 1) return null;
          return (
            <text key={i} x={xOf(i)} y={VH - 5} textAnchor="middle" fill="rgba(255,255,255,0.22)" fontSize="9">
              {p.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Horizontal bar chart for cities ────────────────────────── */

function HorizontalBarChart({ rows }: { rows: CityRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-2">
      {rows.map((r, idx) => {
        const pct = Math.round((r.count / max) * 100);
        return (
          <div key={r.city} className="flex items-center gap-3">
            <span className="w-4 flex-shrink-0 text-right text-[11px] font-bold text-white/25">
              {idx + 1}
            </span>
            <span className="w-24 flex-shrink-0 truncate text-[12px] font-semibold text-white">
              {r.city}
            </span>
            <div className="flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 flex-shrink-0 text-right text-[11px] font-bold text-blue-300">
              {r.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Status rings chart ──────────────────────────────────────── */

function StatusRings({ stats }: { stats: CategoryStat[] }) {
  const total = stats.reduce((s, c) => s + c.total, 0);
  const active = stats.reduce((s, c) => s + c.active, 0);
  const pending = stats.reduce((s, c) => s + c.pending, 0);
  const archived = stats.reduce((s, c) => s + c.archived, 0);
  const other = Math.max(0, total - active - pending - archived);

  const segments: { label: string; value: number; color: string }[] = [
    { label: "Yayında", value: active, color: "#10b981" },
    { label: "Bekleyen", value: pending, color: "#f59e0b" },
    { label: "Arşiv", value: archived, color: "#6b7280" },
    { label: "Diğer", value: other, color: "#3b82f6" },
  ].filter((s) => s.value > 0);

  if (total === 0) {
    return <p className="py-6 text-center text-sm text-[#6a94bc]">Veri yok.</p>;
  }

  // Simple donut with SVG
  const SIZE = 140;
  const STROKE = 22;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;

  let cumulative = 0;
  const arcs = segments.map((seg) => {
    const pct = seg.value / total;
    const arc = { offset: cumulative * CIRC, length: pct * CIRC, ...seg };
    cumulative += pct;
    return arc;
  });

  return (
    <div className="flex flex-col items-center gap-5 py-2 sm:flex-row sm:justify-center">
      {/* SVG Donut */}
      <div className="relative flex-shrink-0">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE}
              strokeDasharray={`${arc.length} ${CIRC - arc.length}`}
              strokeDashoffset={-arc.offset}
              strokeLinecap="butt"
              className="transition-all duration-700"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-extrabold text-white">{total.toLocaleString("tr-TR")}</p>
          <p className="text-[10px] text-white/40">Toplam</p>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2.5">
        {segments.map((seg) => {
          const pct = Math.round((seg.value / total) * 100);
          return (
            <div key={seg.label} className="flex items-center gap-2.5">
              <div className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="w-20 text-[12px] font-semibold text-white">{seg.label}</span>
              <span className="text-[12px] font-extrabold text-white">{seg.value.toLocaleString("tr-TR")}</span>
              <span className="text-[11px] text-white/40">%{pct}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
