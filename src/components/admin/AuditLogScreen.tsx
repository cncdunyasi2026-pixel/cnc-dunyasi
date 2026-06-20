"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import AdminSectionLayout from "@/components/admin/AdminSectionLayout";
import { db } from "@/lib/firebase";
import { coerceFirestoreMillis } from "@/lib/firestore/coerceFirestoreMillis";

type Props = { adminCode: string };

type AuditRow = {
  id: string;
  action?: string;
  listingType?: string;
  listingId?: string;
  staffId?: string;
  detail?: string;
  status?: string;
  reportId?: string;
  createdAt: number;
};

const ACTION_META: Record<string, { label: string; color: string; icon: string }> = {
  publish: { label: "Yayına Alındı", color: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20", icon: "✅" },
  needs_revision: { label: "Revizyon İstendi", color: "text-amber-300 bg-amber-400/10 border-amber-400/20", icon: "✏️" },
  reject: { label: "Reddedildi", color: "text-rose-300 bg-rose-400/10 border-rose-400/20", icon: "❌" },
  archive: { label: "Arşivlendi", color: "text-slate-300 bg-slate-400/10 border-slate-400/20", icon: "🗂️" },
  report_status_update: { label: "Rapor Güncellendi", color: "text-blue-300 bg-blue-400/10 border-blue-400/20", icon: "🚩" },
  edit_fields: { label: "Alanlar Düzenlendi", color: "text-purple-300 bg-purple-400/10 border-purple-400/20", icon: "📝" },
  edit_images: { label: "Görseller Güncellendi", color: "text-purple-300 bg-purple-400/10 border-purple-400/20", icon: "🖼️" },
};

const COLLECTION_LABELS: Record<string, string> = {
  ads: "İkinci El CNC",
  technical_service_listings: "Teknik Servis",
  spare_part_listings: "Yedek Parça",
  job_listings: "Kariyer",
};

function fmtDateTime(ms: number) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(ms: number) {
  if (!ms) return "—";
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} gün önce`;
  return fmtDateTime(ms);
}

export default function AuditLogScreen({ adminCode }: Props) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "audit_logs"), orderBy("createdAt", "desc"), limit(200)),
      );
      setRows(
        snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            action: typeof data.action === "string" ? data.action : undefined,
            listingType: typeof data.listingType === "string" ? data.listingType : undefined,
            listingId: typeof data.listingId === "string" ? data.listingId : undefined,
            staffId: typeof data.staffId === "string" ? data.staffId
              : typeof data.adminId === "string" ? data.adminId
              : undefined,
            detail: typeof data.detail === "string" ? data.detail : undefined,
            status: typeof data.status === "string" ? data.status : undefined,
            reportId: typeof data.reportId === "string" ? data.reportId : undefined,
            createdAt: data.createdAt != null ? coerceFirestoreMillis(data.createdAt) : 0,
          } satisfies AuditRow;
        }),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const actionKeys = ["all", ...Array.from(new Set(rows.map((r) => r.action ?? "other"))).sort()];

  const filtered =
    filter === "all" ? rows : rows.filter((r) => (r.action ?? "other") === filter);

  return (
    <AdminAuthGate adminCode={adminCode}>
      <AdminSectionLayout
        adminCode={adminCode}
        title="Audit Log"
        subtitle="Yönetim tarafında yapılan tüm aksiyon kayıtları."
      >
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.04] border border-white/[0.07]" />
                ))
              : [
                  { label: "Toplam Kayıt", value: rows.length, color: "text-white" },
                  {
                    label: "Son 24 Saat",
                    value: rows.filter((r) => Date.now() - r.createdAt < 86400000).length,
                    color: "text-blue-300",
                  },
                  {
                    label: "Yayına Alınan",
                    value: rows.filter((r) => r.action === "publish").length,
                    color: "text-emerald-300",
                  },
                  {
                    label: "Revizyon/Red",
                    value: rows.filter((r) =>
                      ["needs_revision", "reject"].includes(r.action ?? ""),
                    ).length,
                    color: "text-amber-300",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-white/[0.07] bg-[#0f1c33] px-4 py-3"
                  >
                    <p className="text-[11px] text-[#6a94bc]">{s.label}</p>
                    <p className={`mt-0.5 text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
          </div>

          {/* Filter tabs */}
          {!loading && actionKeys.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {actionKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-bold transition ${
                    filter === key
                      ? "border-blue-500/50 bg-blue-600/20 text-blue-300"
                      : "border-white/[0.07] text-white/40 hover:border-white/20 hover:text-white/70"
                  }`}
                >
                  {key === "all"
                    ? `Tümü (${rows.length})`
                    : `${ACTION_META[key]?.label ?? key} (${rows.filter((r) => (r.action ?? "other") === key).length})`}
                </button>
              ))}
            </div>
          )}

          {/* Log entries */}
          <div className="overflow-hidden rounded-xl border border-white/[0.07]">
            {loading ? (
              <div className="divide-y divide-white/[0.04]">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex animate-pulse items-start gap-3 px-4 py-4">
                    <div className="h-7 w-7 rounded-lg bg-white/[0.06]" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-40 rounded bg-white/[0.07]" />
                      <div className="h-3 w-64 rounded bg-white/[0.05]" />
                    </div>
                    <div className="h-3 w-20 rounded bg-white/[0.05]" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#6a94bc]">
                Audit kaydı bulunamadı.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {filtered.map((row) => {
                  const meta = row.action ? ACTION_META[row.action] : undefined;
                  const collectionLabel = row.listingType
                    ? COLLECTION_LABELS[row.listingType] ?? row.listingType
                    : undefined;

                  return (
                    <div
                      key={row.id}
                      className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-white/[0.02]"
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0 pt-0.5 text-base">
                        {meta?.icon ?? "📌"}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta?.color ?? "text-white/50 bg-white/[0.05] border-white/10"}`}
                          >
                            {meta?.label ?? row.action ?? "İşlem"}
                          </span>
                          {collectionLabel && (
                            <span className="text-[11px] font-semibold text-white/60">
                              {collectionLabel}
                            </span>
                          )}
                          {row.status && (
                            <span className="text-[11px] text-white/40">
                              → <span className="text-white/60">{row.status}</span>
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                          {row.listingId && (
                            <span className="text-[11px] text-[#6a94bc]">
                              İlan:{" "}
                              <code className="rounded bg-white/[0.06] px-1 text-[10px] text-white/50">
                                {row.listingId.slice(0, 12)}…
                              </code>
                            </span>
                          )}
                          {row.reportId && (
                            <span className="text-[11px] text-[#6a94bc]">
                              Rapor:{" "}
                              <code className="rounded bg-white/[0.06] px-1 text-[10px] text-white/50">
                                {row.reportId.slice(0, 12)}…
                              </code>
                            </span>
                          )}
                          {row.staffId && (
                            <span className="text-[11px] text-[#6a94bc]">
                              Yetkili:{" "}
                              <code className="rounded bg-white/[0.06] px-1 text-[10px] text-white/50">
                                {row.staffId.slice(0, 12)}…
                              </code>
                            </span>
                          )}
                        </div>

                        {row.detail && (
                          <p className="mt-1 text-[12px] text-white/50 line-clamp-2">{row.detail}</p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-[11px] text-white/40">{timeAgo(row.createdAt)}</p>
                        <p className="mt-0.5 text-[10px] text-white/25">{fmtDateTime(row.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!loading && (
            <p className="text-center text-xs text-[#4a6a8a]">
              En son {rows.length} kayıt gösteriliyor
            </p>
          )}
        </div>
      </AdminSectionLayout>
    </AdminAuthGate>
  );
}
