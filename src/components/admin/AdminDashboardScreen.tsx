"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Timestamp,
  collection,
  doc,
  documentId,
  getCountFromServer,
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
import type { Ad } from "@/types/ad";
import { mapAdSnapshotToAd } from "@/lib/firestore/mapAdDoc";
import { formatPrice } from "@/lib/utils/format";

type Props = { adminCode: string };

type CollectionStat = {
  label: string;
  collection: string;
  icon: string;
  color: string;
  total: number;
  active: number;
  pending: number;
  archived: number;
};

type DashboardStats = {
  userTotal: number;
  users24h: number;
  users30d: number;
  trafficToday: number;
  trafficTodayDelta: number;
  traffic7d: number;
  traffic7dDelta: number;
  traffic30d: number;
  traffic30dDelta: number;
  totalPending: number;
  totalActive: number;
};

export default function AdminDashboardScreen({ adminCode }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<DashboardStats>({
    userTotal: 0,
    users24h: 0,
    users30d: 0,
    trafficToday: 0,
    trafficTodayDelta: 0,
    traffic7d: 0,
    traffic7dDelta: 0,
    traffic30d: 0,
    traffic30dDelta: 0,
    totalPending: 0,
    totalActive: 0,
  });
  const [collectionStats, setCollectionStats] = useState<CollectionStat[]>([]);
  const [topClicked, setTopClicked] = useState<Ad[]>([]);
  const [homeAds, setHomeAds] = useState<Ad[]>([]);
  const [adminUids, setAdminUids] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  const percent = useCallback((current: number, previous: number) => {
    if (previous <= 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = Date.now();
      const DAY_MS = 86_400_000;

      /** YYYY-MM-DD — yerel saat dilimine göre */
      const dayStr = (ms: number): string => {
        const d = new Date(ms);
        const y = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, "0");
        const da = String(d.getDate()).padStart(2, "0");
        return `${y}-${mo}-${da}`;
      };

      /**
       * analytics_daily koleksiyonundan belirli tarih aralığındaki
       * toplam tıklama sayısını döndürür.
       * Eski listing_click_events yerine günlük aggregate okur:
       * max 30 belge → çok daha az okuma maliyeti.
       */
      const sumDailyClicks = async (fromMs: number, toMs: number): Promise<number> => {
        const snap = await getDocs(
          query(
            collection(db, "analytics_daily"),
            where(documentId(), ">=", dayStr(fromMs)),
            where(documentId(), "<=", dayStr(toMs)),
          ),
        );
        return snap.docs.reduce(
          (sum, d) => sum + ((d.data().clicks as number) ?? 0),
          0,
        );
      };

      const countWhere = async (col: string, field: string, value: string) => {
        const snap = await getCountFromServer(
          query(collection(db, col), where(field, "==", value)),
        );
        return snap.data().count;
      };

      const countAll = async (col: string) => {
        const snap = await getCountFromServer(collection(db, col));
        return snap.data().count;
      };

      const countUsers = async (startMs?: number) => {
        if (startMs == null) {
          return countAll("users");
        }
        const snap = await getCountFromServer(
          query(
            collection(db, "users"),
            where("createdAt", ">=", Timestamp.fromMillis(startMs)),
          ),
        );
        return snap.data().count;
      };

      const LISTING_COLLECTIONS = [
        { col: "ads", label: "İkinci El CNC", icon: "🔧", color: "blue" },
        { col: "technical_service_listings", label: "Teknik Servis", icon: "⚙️", color: "purple" },
        { col: "spare_part_listings", label: "Yedek Parça", icon: "🔩", color: "amber" },
        { col: "job_listings", label: "Kariyer", icon: "💼", color: "emerald" },
      ] as const;

      // Bugünün başlangıcı (gece yarısı, yerel saat)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayMs = todayStart.getTime();
      const yesterdayMs = todayMs - DAY_MS;
      const week7Ms = todayMs - 7 * DAY_MS;
      const prevWeek7Ms = week7Ms - 7 * DAY_MS;
      const month30Ms = todayMs - 30 * DAY_MS;
      const prevMonth30Ms = month30Ms - 30 * DAY_MS;

      const [
        trafficToday, trafficYesterday,
        traffic7d, prevTraffic7d,
        traffic30d, prevTraffic30d,
        userTotal, users24h, users30d,
        ...rest
      ] = await Promise.all([
        sumDailyClicks(todayMs, now),
        sumDailyClicks(yesterdayMs, todayMs - 1),
        sumDailyClicks(week7Ms, now),
        sumDailyClicks(prevWeek7Ms, week7Ms - 1),
        sumDailyClicks(month30Ms, now),
        sumDailyClicks(prevMonth30Ms, month30Ms - 1),
        countUsers(),
        countUsers(now - DAY_MS),
        countUsers(now - 30 * DAY_MS),
        // collection stats: [total, active, pending, archived] × 4
        ...LISTING_COLLECTIONS.flatMap(({ col }) => [
          countAll(col),
          countWhere(col, "status", "published"),
          countWhere(col, "status", "pending"),
          countWhere(col, "status", "archived"),
        ]),
      ]);

      // Parse collection stats
      const colStats: CollectionStat[] = LISTING_COLLECTIONS.map((def, idx) => {
        const base = idx * 4;
        return {
          label: def.label,
          collection: def.col,
          icon: def.icon,
          color: def.color,
          total: (rest[base] as number) ?? 0,
          active: (rest[base + 1] as number) ?? 0,
          pending: (rest[base + 2] as number) ?? 0,
          archived: (rest[base + 3] as number) ?? 0,
        };
      });

      const totalPending = colStats.reduce((s, c) => s + c.pending, 0);
      const totalActive = colStats.reduce((s, c) => s + c.active, 0);

      setCollectionStats(colStats);
      setStats({
        userTotal,
        users24h,
        users30d,
        trafficToday,
        trafficTodayDelta: percent(trafficToday, trafficYesterday),
        traffic7d,
        traffic7dDelta: percent(traffic7d, prevTraffic7d),
        traffic30d,
        traffic30dDelta: percent(traffic30d, prevTraffic30d),
        totalPending,
        totalActive,
      });

      const [topClickedSnap, homeAdsSnap, adminsSnap] = await Promise.all([
        getDocs(query(collection(db, "ads"), orderBy("clickCount", "desc"), limit(10))),
        getDocs(
          query(
            collection(db, "ads"),
            where("status", "==", "published"),
            orderBy("createdAt", "desc"),
            limit(25),
          ),
        ),
        getDocs(query(collection(db, "admins"), limit(50))),
      ]);

      const clickedAds = topClickedSnap.docs
        .map((d) => mapAdSnapshotToAd(d.id, d.data() as Record<string, unknown>))
        .filter((ad) => ad.status === "published")
        .slice(0, 8);

      setTopClicked(clickedAds);
      setHomeAds(
        homeAdsSnap.docs.map((d) =>
          mapAdSnapshotToAd(d.id, d.data() as Record<string, unknown>),
        ),
      );
      setAdminUids(adminsSnap.docs.map((d) => d.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dashboard verileri alınamadı.");
    } finally {
      setLoading(false);
    }
  }, [percent]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard, refreshKey]);

  const featuredCount = useMemo(() => homeAds.filter((ad) => ad.isFeatured).length, [homeAds]);
  const weeklyCount = useMemo(() => homeAds.filter((ad) => ad.weeklyDeal).length, [homeAds]);

  const toggleFlag = async (adId: string, field: "isFeatured" | "weeklyDeal", current?: boolean) => {
    try {
      setSavingId(adId);
      await updateDoc(doc(db, "ads", adId), { [field]: !current });
      setHomeAds((prev) =>
        prev.map((ad) => (ad.id === adId ? { ...ad, [field]: !current } : ad)),
      );
    } finally {
      setSavingId(null);
    }
  };

  const metricBadge = (v: number) =>
    v >= 0
      ? `text-emerald-400 bg-emerald-400/10`
      : `text-rose-400 bg-rose-400/10`;

  return (
    <AdminAuthGate adminCode={adminCode}>
      <AdminSectionLayout adminCode={adminCode}>
        <div className="space-y-6">
          {/* ── Header ─────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-400/60">
                Yönetim Merkezi
              </p>
              <h1 className="mt-0.5 text-2xl font-extrabold text-white">Dashboard</h1>
            </div>
            <button
              type="button"
              onClick={() => setRefreshKey((v) => v + 1)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              <RefreshIcon />
              Yenile
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-400/25 bg-rose-950/30 p-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          {/* ── Temel Metrikler ─────────────────────────── */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Toplam Kullanıcı"
              value={stats.userTotal}
              sub={`+${stats.users24h} bugün · +${stats.users30d} bu ay`}
              icon={<UsersStatIcon />}
              loading={loading}
              accent="blue"
            />
            <StatCard
              label="Aktif İlan"
              value={stats.totalActive}
              sub="Tüm kategorilerde yayında"
              icon={<CheckStatIcon />}
              loading={loading}
              accent="emerald"
            />
            <StatCard
              label="Moderasyon Bekliyor"
              value={stats.totalPending}
              sub="Tüm kategorilerde onay bekliyor"
              icon={<ClockStatIcon />}
              loading={loading}
              accent={stats.totalPending > 0 ? "amber" : "slate"}
            />
            <StatCard
              label="Trafik (Bugün)"
              value={stats.trafficToday}
              sub={`${stats.trafficTodayDelta >= 0 ? "+" : ""}${stats.trafficTodayDelta}% dünkü gün`}
              icon={<TrendStatIcon />}
              loading={loading}
              accent="purple"
            />
          </div>

          {/* ── Trafik Metrikleri ────────────────────────── */}
          <Section title="Platform Trafik Analizi" icon="📊">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Bugün",
                  value: stats.trafficToday,
                  delta: stats.trafficTodayDelta,
                  sub: "dünkü gün",
                },
                {
                  label: "Son 7 Gün",
                  value: stats.traffic7d,
                  delta: stats.traffic7dDelta,
                  sub: "önceki 7 gün",
                },
                {
                  label: "Son 30 Gün",
                  value: stats.traffic30d,
                  delta: stats.traffic30dDelta,
                  sub: "önceki 30 gün",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/[0.07] bg-[#0f1c33] p-4"
                >
                  <p className="text-xs text-[#6a94bc]">{item.label}</p>
                  {loading ? (
                    <div className="mt-2 h-6 w-16 animate-pulse rounded bg-white/10" />
                  ) : (
                    <p className="mt-1 text-3xl font-extrabold text-white">
                      {item.value.toLocaleString("tr-TR")}
                    </p>
                  )}
                  <span
                    className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${metricBadge(item.delta)}`}
                  >
                    {item.delta >= 0 ? "▲" : "▼"} {Math.abs(item.delta)}% {item.sub}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Kategori Dağılımı ────────────────────────── */}
          <Section title="Kategori Dağılımı" icon="📂">
            <div className="overflow-hidden rounded-xl border border-white/[0.07]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.03]">
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#6a94bc]">
                      Kategori
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-[#6a94bc]">
                      Toplam
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-emerald-400/70">
                      Aktif
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-amber-400/70">
                      Bekleyen
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-rose-400/70">
                      Arşiv
                    </th>
                    <th className="hidden px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-[#6a94bc] sm:table-cell">
                      Yönet
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-4 py-3">
                            <div className="h-4 w-32 rounded bg-white/10" />
                          </td>
                          {[...Array(4)].map((__, j) => (
                            <td key={j} className="px-4 py-3 text-right">
                              <div className="ml-auto h-4 w-8 rounded bg-white/10" />
                            </td>
                          ))}
                          <td className="hidden px-4 py-3 sm:table-cell" />
                        </tr>
                      ))
                    : collectionStats.map((cs) => (
                        <tr
                          key={cs.collection}
                          className="transition hover:bg-white/[0.03]"
                        >
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-2 font-semibold text-white">
                              <span className="text-base">{cs.icon}</span>
                              {cs.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-white">
                            {cs.total.toLocaleString("tr-TR")}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-bold text-emerald-300">
                              {cs.active}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {cs.pending > 0 ? (
                              <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-bold text-amber-300">
                                {cs.pending}
                              </span>
                            ) : (
                              <span className="text-xs text-white/25">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs text-white/40">
                              {cs.archived}
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 text-right sm:table-cell">
                            <Link
                              href={`/${adminCode}/admin/moderasyon`}
                              className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-bold text-blue-300 transition hover:border-blue-400/40 hover:bg-blue-900/20"
                            >
                              Moderasyon →
                            </Link>
                          </td>
                        </tr>
                      ))}
                </tbody>
                {!loading && collectionStats.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-white/[0.07] bg-white/[0.02]">
                      <td className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-white/40">
                        Toplam
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-extrabold text-white">
                        {collectionStats.reduce((s, c) => s + c.total, 0).toLocaleString("tr-TR")}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-extrabold text-emerald-300">
                        {stats.totalActive}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-extrabold text-amber-300">
                        {stats.totalPending}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-white/40">
                        {collectionStats.reduce((s, c) => s + c.archived, 0)}
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Section>

          {/* ── En Çok Tıklanan + Anasayfa Yönetimi ───────── */}
          <div className="grid gap-6 xl:grid-cols-2">
            {/* En çok tıklanan */}
            <Section title="En Çok Tıklanan İlanlar" icon="🔥">
              <div className="space-y-2">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-12 animate-pulse rounded-xl bg-white/[0.05]"
                      />
                    ))
                  : topClicked.length === 0
                  ? (
                    <p className="rounded-xl border border-white/[0.07] p-4 text-sm text-[#6a94bc]">
                      Henüz tıklanma verisi yok.
                    </p>
                  )
                  : topClicked.map((ad, idx) => (
                    <div
                      key={ad.id}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#0f1c33] p-3 transition hover:bg-[#13264a]"
                    >
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-extrabold text-white/50">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {ad.title}
                        </p>
                        <p className="text-xs text-[#6a94bc]">
                          {ad.city} · {formatPrice(ad.price, ad.currency)}
                        </p>
                      </div>
                      <span className="flex-shrink-0 rounded-full bg-blue-400/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-300">
                        {(ad.clickCount ?? 0).toLocaleString("tr-TR")} tık
                      </span>
                    </div>
                  ))}
              </div>
            </Section>

            {/* Anasayfa yönetimi */}
            <Section
              title="Anasayfa Vitrin Yönetimi"
              icon="🏠"
              badge={`Öne çıkan: ${featuredCount} · Fırsat: ${weeklyCount}`}
            >
              <p className="mb-3 text-xs text-[#6a94bc]">
                Yayındaki ilanların vitrin bayraklarını buradan aç/kapat.
              </p>
              <div className="max-h-96 space-y-2 overflow-auto pr-1">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-16 animate-pulse rounded-xl bg-white/[0.05]"
                      />
                    ))
                  : homeAds.length === 0
                  ? (
                    <p className="rounded-xl border border-white/[0.07] p-4 text-sm text-[#6a94bc]">
                      Yayında ilan bulunamadı.
                    </p>
                  )
                  : homeAds.map((ad) => (
                    <div
                      key={ad.id}
                      className="rounded-xl border border-white/[0.07] bg-[#0f1c33] p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-white leading-snug">
                          {ad.title}
                        </p>
                        <p className="flex-shrink-0 text-xs text-[#6a94bc]">
                          {formatPrice(ad.price, ad.currency)}
                        </p>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <ToggleBtn
                          active={!!ad.isFeatured}
                          saving={savingId === ad.id}
                          onLabel="⭐ Öne Çıkan: Açık"
                          offLabel="⭐ Öne Çıkan"
                          activeClass="bg-amber-500/20 border-amber-400/40 text-amber-300"
                          onClick={() => void toggleFlag(ad.id, "isFeatured", ad.isFeatured)}
                        />
                        <ToggleBtn
                          active={!!ad.weeklyDeal}
                          saving={savingId === ad.id}
                          onLabel="💚 Haftanın Fırsatı: Açık"
                          offLabel="💚 Haftanın Fırsatı"
                          activeClass="bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                          onClick={() => void toggleFlag(ad.id, "weeklyDeal", ad.weeklyDeal)}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </Section>
          </div>

          {/* ── Yetkili Hesaplar ─────────────────────────── */}
          <Section title="Yetkili Admin Hesapları" icon="🔐">
            <p className="mb-3 text-xs text-[#6a94bc]">
              Yetki kaynağı: <code className="rounded bg-white/[0.07] px-1.5 py-0.5 text-[11px] text-blue-300">users/{"{uid}"}.roles.admin = true</code> veya{" "}
              <code className="rounded bg-white/[0.07] px-1.5 py-0.5 text-[11px] text-blue-300">admins/{"{uid}"}</code> kaydı.
            </p>
            {loading ? (
              <div className="flex gap-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-7 w-40 animate-pulse rounded-full bg-white/[0.07]" />
                ))}
              </div>
            ) : adminUids.length === 0 ? (
              <p className="text-sm text-[#6a94bc]">
                admins koleksiyonunda kayıt bulunamadı.{" "}
                <Link href={`/${adminCode}/admin/kullanicilar`} className="text-blue-400 underline">
                  Kullanıcılar sayfasından
                </Link>{" "}
                yetki verebilirsiniz.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {adminUids.map((uid) => (
                  <span
                    key={uid}
                    className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-1 text-[11px] font-semibold text-emerald-300"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {uid}
                  </span>
                ))}
              </div>
            )}
          </Section>

          {/* ── Hızlı Erişim ────────────────────────────── */}
          <Section title="Hızlı Erişim" icon="⚡">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "İlan Moderasyonu",
                  desc: "Bekleyen ilanları incele",
                  href: `/${adminCode}/admin/moderasyon`,
                  badge: stats.totalPending > 0 ? String(stats.totalPending) : undefined,
                  badgeColor: "bg-amber-500",
                },
                {
                  label: "Kullanıcılar",
                  desc: "Üyeleri yönet ve yetki ver",
                  href: `/${adminCode}/admin/kullanicilar`,
                },
                {
                  label: "Raporlar",
                  desc: "Kullanıcı şikayetlerini gör",
                  href: `/${adminCode}/admin/raporlar`,
                },
                {
                  label: "Audit Log",
                  desc: "Admin işlem geçmişi",
                  href: `/${adminCode}/admin/audit-log`,
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative rounded-xl border border-white/[0.07] bg-[#0f1c33] p-4 transition hover:border-blue-500/40 hover:bg-[#13264a]"
                >
                  {item.badge && (
                    <span
                      className={`absolute right-3 top-3 flex h-5 min-w-5 items-center justify-center rounded-full ${item.badgeColor} px-1.5 text-[10px] font-extrabold text-white`}
                    >
                      {item.badge}
                    </span>
                  )}
                  <p className="font-bold text-white">{item.label}</p>
                  <p className="mt-0.5 text-xs text-[#6a94bc]">{item.desc}</p>
                  <p className="mt-3 text-[11px] font-semibold text-blue-400/60 transition group-hover:text-blue-400">
                    Git →
                  </p>
                </Link>
              ))}
            </div>
          </Section>
        </div>
      </AdminSectionLayout>
    </AdminAuthGate>
  );
}

/* ── Sub-components ────────────────────────────────────────── */

function Section({
  title,
  icon,
  badge,
  children,
}: {
  title: string;
  icon?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon && <span className="text-base">{icon}</span>}
        <h2 className="font-extrabold text-white">{title}</h2>
        {badge && (
          <span className="ml-auto rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/50">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

type AccentColor = "blue" | "emerald" | "amber" | "purple" | "slate";

function StatCard({
  label,
  value,
  sub,
  icon,
  loading,
  accent,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  loading: boolean;
  accent: AccentColor;
}) {
  const accentMap: Record<AccentColor, { bg: string; icon: string; value: string }> = {
    blue: {
      bg: "border-blue-500/20 bg-gradient-to-br from-[#0d1c38] to-[#0a1628]",
      icon: "bg-blue-500/20 text-blue-400",
      value: "text-white",
    },
    emerald: {
      bg: "border-emerald-500/20 bg-gradient-to-br from-[#0d2420] to-[#0a1628]",
      icon: "bg-emerald-500/20 text-emerald-400",
      value: "text-emerald-100",
    },
    amber: {
      bg: "border-amber-500/20 bg-gradient-to-br from-[#231b0a] to-[#0a1628]",
      icon: "bg-amber-500/20 text-amber-400",
      value: "text-amber-100",
    },
    purple: {
      bg: "border-purple-500/20 bg-gradient-to-br from-[#1a0d2e] to-[#0a1628]",
      icon: "bg-purple-500/20 text-purple-400",
      value: "text-purple-100",
    },
    slate: {
      bg: "border-white/[0.07] bg-[#0f1c33]",
      icon: "bg-white/[0.07] text-white/40",
      value: "text-white",
    },
  };
  const c = accentMap[accent];

  return (
    <div className={`rounded-xl border p-4 ${c.bg}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-[#6a94bc]">{label}</p>
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${c.icon}`}>
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="mt-2 h-7 w-20 animate-pulse rounded bg-white/10" />
      ) : (
        <p className={`mt-2 text-3xl font-extrabold ${c.value}`}>
          {value.toLocaleString("tr-TR")}
        </p>
      )}
      <p className="mt-1 text-[11px] text-[#4a6a8a]">{sub}</p>
    </div>
  );
}

function ToggleBtn({
  active,
  saving,
  onLabel,
  offLabel,
  activeClass,
  onClick,
}: {
  active: boolean;
  saving: boolean;
  onLabel: string;
  offLabel: string;
  activeClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-50 ${
        active
          ? activeClass
          : "border-white/[0.07] bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/80"
      }`}
    >
      {active ? onLabel : offLabel}
    </button>
  );
}

function RefreshIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function UsersStatIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    </svg>
  );
}

function CheckStatIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}

function ClockStatIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    </svg>
  );
}

function TrendStatIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

