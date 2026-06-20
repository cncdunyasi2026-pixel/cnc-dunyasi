"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdDetailContent from "@/components/ad/AdDetailContent";
import { useAuth } from "@/hooks/useAuth";
import { getAdById } from "@/services/adService";
import type { Ad } from "@/types/ad";

const STATUS_BANNER: Record<string, { label: string; color: string; note: string }> = {
  pending: {
    label: "İnceleme Bekliyor",
    color: "bg-amber-50 border-amber-300 text-amber-900",
    note: "İlanınız moderasyon ekibi tarafından inceleniyor. Onaylandıktan sonra sitede yayınlanacak.",
  },
  update_pending: {
    label: "Güncelleme İnceleniyor",
    color: "bg-blue-50 border-blue-300 text-blue-900",
    note: "Güncellemeniz inceleme aşamasında. Onaylanınca mevcut ilan otomatik güncellenecek.",
  },
  revision_resubmitted: {
    label: "Düzeltme Gönderildi",
    color: "bg-blue-50 border-blue-300 text-blue-900",
    note: "Revize edilmiş ilanınız yeniden incelemeye gönderildi.",
  },
  needs_revision: {
    label: "Revizyon Gerekiyor",
    color: "bg-red-50 border-red-300 text-red-900",
    note: "Adminimiz ilanınızda bazı düzenlemeler istedi. Lütfen düzenle sayfasından gerekli alanları güncelleyin.",
  },
  published: {
    label: "Yayında",
    color: "bg-green-50 border-green-300 text-green-900",
    note: "İlanınız aktif olarak yayında.",
  },
  archived: {
    label: "Arşivlendi",
    color: "bg-gray-100 border-gray-300 text-gray-700",
    note: "Bu ilan arşivlenmiş ve artık herkese görünmüyor.",
  },
};

export default function ListingPreviewPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { user, loading: authLoading } = useAuth();

  const [ad, setAd] = useState<Ad | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user || !id) return;

    void getAdById(id)
      .then((result) => {
        if (!result) {
          setAd(null);
          return;
        }
        // Sadece sahibi görebilir
        const ownerId = result.ownerId ?? (result as unknown as Record<string, string>).userId;
        if (ownerId !== user.uid) {
          setAd(null);
          return;
        }
        setAd(result);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "İlan yüklenemedi.");
        setAd(null);
      });
  }, [id, user, authLoading]);

  if (authLoading || ad === undefined) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm font-semibold text-[#7A8CA5]">Yükleniyor...</p>
      </div>
    );
  }

  if (error || ad === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-bold text-[#0F2A4A]">İlan bulunamadı</p>
        <Link href="/hesap/ilanlarim" className="mt-4 inline-block text-sm font-semibold text-[#F26A1B] hover:underline">
          İlanlarıma dön
        </Link>
      </div>
    );
  }

  const status = ad.status ?? "pending";
  const banner = STATUS_BANNER[status] ?? STATUS_BANNER.pending;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      {/* Durum banner */}
      <div className={`mb-4 rounded-xl border px-4 py-3 ${banner.color}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">İlan Durumu</p>
            <p className="mt-0.5 text-base font-extrabold">{banner.label}</p>
            <p className="mt-1 text-xs opacity-80">{banner.note}</p>
          </div>
          <div className="flex gap-2">
            {status !== "archived" ? (
              <Link
                href={`/hesap/ilanlarim/duzenle/${id}`}
                className="rounded-lg border border-current bg-white/60 px-3 py-2 text-xs font-bold transition hover:bg-white/90"
              >
                Düzenle
              </Link>
            ) : null}
            <Link
              href="/hesap/ilanlarim"
              className="rounded-lg border border-current bg-white/60 px-3 py-2 text-xs font-bold transition hover:bg-white/90"
            >
              ← İlanlarıma Dön
            </Link>
          </div>
        </div>
      </div>

      {/* İlan önizlemesi */}
      <AdDetailContent ad={ad} />
    </div>
  );
}
