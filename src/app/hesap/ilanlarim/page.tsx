"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyListings, type MyListingsBundle } from "@/services/myListingsService";
import type { ListingLifecycleStatus } from "@/types/listingStatus";
import { formatPrice } from "@/lib/utils/format";
import { archiveListingDoc } from "@/lib/firestore/listingLifecycle";
import { revisionFieldLabel } from "@/lib/moderation/revisionFieldLabels";
import type { Ad } from "@/types/ad";
import type { MyJobListingRow, MyMarketplaceListingRow } from "@/types/myListings";

function statusLabel(status: ListingLifecycleStatus | undefined): string {
  switch (status) {
    case "draft":
      return "Taslak";
    case "pending":
      return "Onay bekliyor";
    case "update_pending":
      return "Güncelleme incelemede";
    case "revision_resubmitted":
      return "Düzeltme gönderildi";
    case "needs_revision":
      return "Revizyon";
    case "published":
      return "Yayında";
    case "rejected":
      return "Reddedildi";
    case "archived":
      return "Arşiv";
    default:
      return "Durum bilinmiyor";
  }
}

function statusPillClass(status: ListingLifecycleStatus | undefined): string {
  switch (status) {
    case "published":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-950";
    case "update_pending":
      return "border-blue-200 bg-blue-50 text-blue-900";
    case "revision_resubmitted":
      return "border-violet-200 bg-violet-50 text-violet-900";
    case "needs_revision":
      return "border-orange-200 bg-orange-50 text-orange-950";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-900";
    case "draft":
      return "border-[#dbe2ea] bg-[#f4f7fb] text-[#5f6f86]";
    case "archived":
      return "border-[#dbe2ea] bg-neutral-100 text-neutral-700";
    default:
      return "border-[#dbe2ea] bg-white text-[#5f6f86]";
  }
}

function formatRowDate(ms: number) {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function RevisionFieldsNote({ fields }: { fields?: Record<string, string> }) {
  if (!fields || Object.keys(fields).length === 0) return null;
  return (
    <div className="mx-3 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-snug text-red-900">
      <p className="font-bold">Reddedilen alanlar:</p>
      {Object.entries(fields).map(([key, value]) => (
        <p key={key}>
          - {revisionFieldLabel(key)}: {value}
        </p>
      ))}
    </div>
  );
}

const REMOVAL_REASONS = [
  "Ürün bu platformdan satıldı",
  "Ürün farklı platformdan satıldı",
  "Satmaktan vazgeçtim",
  "Diğer",
] as const;

type ListingCollection =
  | "ads"
  | "technical_service_listings"
  | "spare_part_listings"
  | "job_listings";

export default function IlanlarimPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bundle, setBundle] = useState<MyListingsBundle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [archivingKey, setArchivingKey] = useState<string | null>(null);
  const [archiveDialog, setArchiveDialog] = useState<{
    collection: ListingCollection;
    id: string;
  } | null>(null);
  const [archiveReason, setArchiveReason] = useState<(typeof REMOVAL_REASONS)[number]>("Ürün bu platformdan satıldı");
  const [archiveReasonOtherText, setArchiveReasonOtherText] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/hesap/giris?redirect=${encodeURIComponent("/hesap/ilanlarim")}`);
      return;
    }

    let cancelled = false;
    setListLoading(true);
    setLoadError(null);

    void fetchMyListings(user.uid)
      .then((data) => {
        if (!cancelled) setBundle(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Listeler yüklenemedi.");
        }
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  if (authLoading || (!user && !loadError)) {
    return (
      <div className="mx-auto flex max-w-4xl justify-center px-4 py-16">
        <p className="text-sm font-semibold text-[#7A8CA5]">Yükleniyor...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleArchive = async (
    collectionName: ListingCollection,
    id: string,
    reason: string,
  ) => {
    if (!user) return;
    setArchivingKey(`${collectionName}:${id}`);
    setLoadError(null);
    try {
      await archiveListingDoc(collectionName, id, reason);
      const refreshed = await fetchMyListings(user.uid);
      setBundle(refreshed);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "İlan arşive alınamadı.");
    } finally {
      setArchivingKey(null);
      setArchiveDialog(null);
    }
  };

  const empty =
    bundle &&
    bundle.ads.length === 0 &&
    bundle.technical.length === 0 &&
    bundle.spareParts.length === 0 &&
    bundle.jobs.length === 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[#7A8CA5]">HESABIM</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#0F2A4A] md:text-3xl">İlanlarım</h1>
          <p className="mt-2 max-w-xl text-sm text-[#5f6f86]">
            Tüm kategorilerde verdiğin ilanları ve durumlarını buradan takip edebilirsin.
          </p>
        </div>
        <Link
          href="/ilan-ver"
          className="inline-flex justify-center rounded-xl bg-[#F26A1B] px-4 py-3 text-sm font-bold !text-white visited:!text-white hover:!text-white shadow-[0_8px_20px_rgba(242,106,27,0.28)] transition hover:bg-[#dd5f15]"
        >
          Yeni ilan ver
        </Link>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{loadError}</p>
      ) : null}

      {listLoading && !bundle ? (
        <p className="text-sm font-semibold text-[#7A8CA5]">Kayıtlar getiriliyor...</p>
      ) : null}

      {bundle && empty ? (
        <div className="rounded-2xl border border-[#dbe2ea] bg-[#f8fafc] px-6 py-12 text-center">
          <p className="text-sm font-semibold text-[#0F2A4A]">Henüz ilan yok</p>
          <p className="mt-2 text-sm text-[#5f6f86]">İlk ilanını vererek CNC vitrininde yerini al.</p>
          <Link
            href="/ilan-ver"
            className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-[#0F2A4A] to-[#1A4A7A] px-6 py-3 text-sm font-bold text-white"
          >
            İlan ver
          </Link>
        </div>
      ) : null}

      {bundle ? (
        <div className="space-y-10">
          <OwnerListingBlock title="İkinci el CNC" subtitle="Tezgah ilanların">
            {bundle.ads.length === 0 ? (
              <p className="text-sm text-[#7A8CA5]">Bu kategoride ilan yok.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {bundle.ads.map((ad) => (
                  <AdRow
                    key={ad.id}
                    ad={ad}
                    onOpen={() => router.push(`/ilan/${ad.id}`)}
                    onEdit={() => router.push(`/hesap/ilanlarim/duzenle/${ad.id}`)}
                    onArchive={() => {
                      setArchiveReason("Ürün bu platformdan satıldı");
                      setArchiveReasonOtherText("");
                      setArchiveDialog({ collection: "ads", id: ad.id });
                    }}
                    archiving={archivingKey === `ads:${ad.id}`}
                  />
                ))}
              </ul>
            )}
          </OwnerListingBlock>

          <OwnerListingBlock title="Teknik servis" subtitle="Servis profillerin">
            {bundle.technical.length === 0 ? (
              <p className="text-sm text-[#7A8CA5]">Bu kategoride ilan yok.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {bundle.technical.map((row) => (
                  <MarketplaceRow
                    key={row.id}
                    row={row}
                    onOpen={() => router.push(`/kategori/teknik-servis/${row.slug}`)}
                    onEdit={() => router.push(`/kategori/teknik-servis/${row.slug}`)}
                    onArchive={() => {
                      setArchiveReason("Ürün bu platformdan satıldı");
                      setArchiveReasonOtherText("");
                      setArchiveDialog({ collection: "technical_service_listings", id: row.id });
                    }}
                    archiving={archivingKey === `technical_service_listings:${row.id}`}
                  />
                ))}
              </ul>
            )}
          </OwnerListingBlock>

          <OwnerListingBlock title="Yedek parça" subtitle="Firma ilanların">
            {bundle.spareParts.length === 0 ? (
              <p className="text-sm text-[#7A8CA5]">Bu kategoride ilan yok.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {bundle.spareParts.map((row) => (
                  <MarketplaceRow
                    key={row.id}
                    row={row}
                    onOpen={() => router.push(`/kategori/yedek-parca/${row.slug}`)}
                    onEdit={() => router.push(`/kategori/yedek-parca/${row.slug}`)}
                    onArchive={() => {
                      setArchiveReason("Ürün bu platformdan satıldı");
                      setArchiveReasonOtherText("");
                      setArchiveDialog({ collection: "spare_part_listings", id: row.id });
                    }}
                    archiving={archivingKey === `spare_part_listings:${row.id}`}
                  />
                ))}
              </ul>
            )}
          </OwnerListingBlock>

          <OwnerListingBlock title="Kariyer" subtitle="İş ilanların">
            {bundle.jobs.length === 0 ? (
              <p className="text-sm text-[#7A8CA5]">Bu kategoride ilan yok.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {bundle.jobs.map((row) => (
                  <JobRow
                    key={row.id}
                    row={row}
                    onOpen={() => router.push(`/kariyer/${row.slug}`)}
                    onEdit={() => router.push(`/kariyer/${row.slug}`)}
                    onArchive={() => {
                      setArchiveReason("Ürün bu platformdan satıldı");
                      setArchiveReasonOtherText("");
                      setArchiveDialog({ collection: "job_listings", id: row.id });
                    }}
                    archiving={archivingKey === `job_listings:${row.id}`}
                  />
                ))}
              </ul>
            )}
          </OwnerListingBlock>
        </div>
      ) : null}

      <p className="mt-10 text-center text-xs text-[#7A8CA5] md:text-left">
        <Link href="/hesap/profil" className="font-semibold hover:text-[#0F2A4A]">
          ← Profil'e dön
        </Link>
      </p>

      {archiveDialog ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-extrabold text-[#0F2A4A]">İlanı kaldır</h3>
            <p className="mt-1 text-sm text-[#5f6f86]">
              Kaldırma nedenini seç. İlan arşive alınır ve 6 ay sonra sistemden silinir.
            </p>
            <select
              className="mt-4 h-11 w-full rounded-xl border border-[#d3dcea] px-3 text-sm text-[#0F2A4A]"
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value as (typeof REMOVAL_REASONS)[number])}
            >
              {REMOVAL_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
            {archiveReason === "Diğer" ? (
              <textarea
                className="mt-3 min-h-[88px] w-full rounded-xl border border-[#d3dcea] px-3 py-2 text-sm text-[#0F2A4A]"
                placeholder="Kaldırma nedenini yazın"
                value={archiveReasonOtherText}
                onChange={(e) => setArchiveReasonOtherText(e.target.value)}
              />
            ) : null}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-[#d3dcea] px-4 py-2 text-sm font-semibold text-[#0F2A4A]"
                onClick={() => setArchiveDialog(null)}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-[#0F2A4A] px-4 py-2 text-sm font-bold text-white"
                disabled={archivingKey === `${archiveDialog.collection}:${archiveDialog.id}`}
                onClick={() =>
                  handleArchive(
                    archiveDialog.collection,
                    archiveDialog.id,
                    archiveReason === "Diğer"
                      ? archiveReasonOtherText.trim() || "Diğer"
                      : archiveReason,
                  )
                }
              >
                {archivingKey === `${archiveDialog.collection}:${archiveDialog.id}`
                  ? "Kaldırılıyor..."
                  : "Kaldır"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OwnerListingBlock({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#dbe2ea] bg-white p-5 shadow-sm md:p-6">
      <div className="mb-4 border-b border-[#eef2f6] pb-4">
        <h2 className="text-lg font-extrabold text-[#0F2A4A]">{title}</h2>
        <p className="text-xs text-[#7A8CA5]">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function AdRow({
  ad,
  onOpen,
  onEdit,
  onArchive,
  archiving,
}: {
  ad: Ad;
  onOpen: () => void;
  onEdit: () => void;
  onArchive: () => void;
  archiving: boolean;
}) {
  const status = ad.status;
  const isArchived = status === "archived";
  const cover = ad.images[0] ?? "/banner_1.jpg";
  return (
    <li
      className={`cursor-pointer overflow-hidden rounded-xl border border-[#dbe2ea] bg-white ${isArchived ? "grayscale opacity-55" : ""}`}
      onClick={onOpen}
    >
      <div className="flex">
        <img src={cover} alt={ad.title} className="h-24 w-28 object-cover" />
        <div className="min-w-0 flex-1 px-3 py-2">
          <Link href={`/ilan/${ad.id}`} className="font-semibold text-[#0F2A4A] hover:text-[#F26A1B] hover:underline">
            {ad.title}
          </Link>
          <p className="mt-1 text-xs text-[#5f6f86]">{ad.city} / {ad.district} · {formatPrice(ad.price, ad.currency)}</p>
          <p className="mt-1 text-[11px] text-[#7A8CA5]">{formatRowDate(ad.createdAt)}</p>
        </div>
      </div>
      {ad.revisionNote && (!ad.revisionFields || Object.keys(ad.revisionFields).length === 0) ? (
        <p className="mx-3 mb-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-[11px] leading-snug text-orange-950">
          <span className="font-bold">Moderasyon notu: </span>
          {ad.revisionNote}
        </p>
      ) : null}
      <RevisionFieldsNote fields={ad.revisionFields} />
      <div className="flex items-center justify-between gap-2 border-t border-[#eef2f6] px-3 py-2">
        <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${statusPillClass(status)}`}>
          {statusLabel(status)}
        </span>
        {status !== "archived" ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="rounded-lg border border-[#dbe2ea] px-3 py-1 text-[11px] font-semibold text-[#0F2A4A] transition hover:border-[#0F2A4A] hover:text-[#0F2A4A]"
            >
              Düzenle
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onArchive();
              }}
              disabled={archiving}
              className="rounded-lg border border-[#dbe2ea] px-3 py-1 text-[11px] font-semibold text-[#5f6f86] transition hover:border-[#0F2A4A] hover:text-[#0F2A4A] disabled:opacity-60"
            >
              {archiving ? "Kaldırılıyor..." : "İlanı kaldır"}
            </button>
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-[#7A8CA5]">Kaldırıldı</span>
        )}
      </div>
    </li>
  );
}

function MarketplaceRow({
  row,
  onOpen,
  onEdit,
  onArchive,
  archiving,
}: {
  row: MyMarketplaceListingRow;
  onOpen: () => void;
  onEdit: () => void;
  onArchive: () => void;
  archiving: boolean;
}) {
  const href =
    row.kind === "technical" ? `/kategori/teknik-servis/${row.slug}` : `/kategori/yedek-parca/${row.slug}`;
  const isArchived = row.status === "archived";
  const cover = row.imageUrl ?? "/banner_1.jpg";
  return (
    <li
      className={`cursor-pointer overflow-hidden rounded-xl border border-[#dbe2ea] bg-white ${isArchived ? "grayscale opacity-55" : ""}`}
      onClick={onOpen}
    >
      <div className="flex">
        <img src={cover} alt={row.title} className="h-24 w-28 object-cover" />
        <div className="min-w-0 flex-1 px-3 py-2">
          <Link href={href} className="font-semibold text-[#0F2A4A] hover:text-[#F26A1B] hover:underline">
            {row.title}
          </Link>
          <p className="mt-1 text-xs text-[#5f6f86]">{row.name} · {row.city}</p>
          <p className="mt-1 text-[11px] text-[#7A8CA5]">{formatRowDate(row.createdAt)}</p>
        </div>
      </div>
      {row.revisionNote && (!row.revisionFields || Object.keys(row.revisionFields).length === 0) ? (
        <p className="mx-3 mb-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-[11px] leading-snug text-orange-950">
          <span className="font-bold">Moderasyon notu: </span>
          {row.revisionNote}
        </p>
      ) : null}
      <RevisionFieldsNote fields={row.revisionFields} />
      <div className="flex items-center justify-between gap-2 border-t border-[#eef2f6] px-3 py-2">
        <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${statusPillClass(row.status)}`}>
          {statusLabel(row.status)}
        </span>
        {row.status !== "archived" ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="rounded-lg border border-[#dbe2ea] px-3 py-1 text-[11px] font-semibold text-[#0F2A4A] transition hover:border-[#0F2A4A] hover:text-[#0F2A4A]"
            >
              Düzenle
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onArchive();
              }}
              disabled={archiving}
              className="rounded-lg border border-[#dbe2ea] px-3 py-1 text-[11px] font-semibold text-[#5f6f86] transition hover:border-[#0F2A4A] hover:text-[#0F2A4A] disabled:opacity-60"
            >
              {archiving ? "Kaldırılıyor..." : "İlanı kaldır"}
            </button>
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-[#7A8CA5]">Kaldırıldı</span>
        )}
      </div>
    </li>
  );
}

function JobRow({
  row,
  onOpen,
  onEdit,
  onArchive,
  archiving,
}: {
  row: MyJobListingRow;
  onOpen: () => void;
  onEdit: () => void;
  onArchive: () => void;
  archiving: boolean;
}) {
  const isArchived = row.status === "archived";
  const cover = row.imageUrl ?? "/banner_1.jpg";
  return (
    <li
      className={`cursor-pointer overflow-hidden rounded-xl border border-[#dbe2ea] bg-white ${isArchived ? "grayscale opacity-55" : ""}`}
      onClick={onOpen}
    >
      <div className="flex">
        <img src={cover} alt={row.title} className="h-24 w-28 object-cover" />
        <div className="min-w-0 flex-1 px-3 py-2">
          <Link href={`/kariyer/${row.slug}`} className="font-semibold text-[#0F2A4A] hover:text-[#F26A1B] hover:underline">
            {row.title}
          </Link>
          <p className="mt-1 text-xs text-[#5f6f86]">{row.company}</p>
          <p className="mt-1 text-[11px] text-[#7A8CA5]">{formatRowDate(row.createdAt)}</p>
        </div>
      </div>
      {row.revisionNote && (!row.revisionFields || Object.keys(row.revisionFields).length === 0) ? (
        <p className="mx-3 mb-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-[11px] leading-snug text-orange-950">
          <span className="font-bold">Moderasyon notu: </span>
          {row.revisionNote}
        </p>
      ) : null}
      <RevisionFieldsNote fields={row.revisionFields} />
      <div className="flex items-center justify-between gap-2 border-t border-[#eef2f6] px-3 py-2">
        <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${statusPillClass(row.status)}`}>
          {statusLabel(row.status)}
        </span>
        {row.status !== "archived" ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="rounded-lg border border-[#dbe2ea] px-3 py-1 text-[11px] font-semibold text-[#0F2A4A] transition hover:border-[#0F2A4A] hover:text-[#0F2A4A]"
            >
              Düzenle
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onArchive();
              }}
              disabled={archiving}
              className="rounded-lg border border-[#dbe2ea] px-3 py-1 text-[11px] font-semibold text-[#5f6f86] transition hover:border-[#0F2A4A] hover:text-[#0F2A4A] disabled:opacity-60"
            >
              {archiving ? "Kaldırılıyor..." : "İlanı kaldır"}
            </button>
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-[#7A8CA5]">Kaldırıldı</span>
        )}
      </div>
    </li>
  );
}
