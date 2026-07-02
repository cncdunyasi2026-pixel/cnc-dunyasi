"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ListingSubmitOverlay from "@/components/listing/ListingSubmitOverlay";
import { useAuth } from "@/hooks/useAuth";
import { peekAdListingDraft } from "@/lib/listing/listingDraftStore";
import { confirmListingPayment } from "@/services/listingPaymentService";
import { publishAdListingDraft } from "@/services/publishListingDraft";

export type OdemeKindMeta = {
  eyebrow: string;
  label: string;
  successHref: string;
  browseHref: string;
  formHref: string;
};

type Props = {
  listingId?: string;
  kind: string;
  mode?: string;
  meta: OdemeKindMeta;
};

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OdemeClient({ listingId, kind, mode, meta }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const isDraftMode = mode === "draft" && kind === "ads";
  const startedAt = Date.now();
  const dueAt = startedAt + 24 * 60 * 60 * 1000;

  useEffect(() => {
    if (!isDraftMode || !user) {
      setHasDraft(false);
      return;
    }
    setHasDraft(Boolean(peekAdListingDraft(user.uid)));
  }, [isDraftMode, user]);

  const handleConfirm = async () => {
    if (!user) {
      const redirect = listingId
        ? `/odeme?listingId=${listingId}&kind=${kind}`
        : `/odeme?kind=${kind}&mode=draft`;
      router.push(`/hesap/giris?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    setConfirming(true);
    setError(null);

    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      if (isDraftMode) {
        const draft = peekAdListingDraft(user.uid);
        if (!draft) {
          throw new Error("İlan bilgisi bulunamadı. Lütfen formu tekrar doldurun.");
        }
        await publishAdListingDraft(draft);
      } else {
        if (!listingId) {
          throw new Error("İlan kodu bulunamadı.");
        }
        await confirmListingPayment(kind, listingId);
      }

      setCompleted(true);
      router.push(meta.successHref);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ödeme onaylanamadı.");
      setConfirming(false);
    }
  };

  const canConfirm = isDraftMode ? hasDraft : Boolean(listingId);
  const draftHasVideo =
    isDraftMode && user ? Boolean(peekAdListingDraft(user.uid)?.videoFile) : false;

  return (
    <>
      {confirming ? (
        <ListingSubmitOverlay
          title="İlanınız yayınlanıyor"
          subtitle={
            draftHasVideo
              ? "Görseller ve video yükleniyor. Video varsa sıkıştırma bir dakikaya kadar sürebilir; lütfen sayfayı kapatmayın."
              : "Görselleriniz yükleniyor ve ilanınız kaydediliyor. Lütfen bu sayfadan ayrılmayın."
          }
        />
      ) : (
        <section className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
          <div className="space-y-5 rounded-2xl border border-[#dbe2ea] bg-white p-6 shadow-sm">
            <div className="text-center">
              <p className="text-xs font-semibold tracking-[0.16em] text-[#7A8CA5]">
                {meta.eyebrow} · ÖDEME ADIMI
              </p>
              <h1 className="mt-1 text-2xl font-extrabold text-[#0F2A4A]">
                {completed ? "İlanınız incelemeye gönderildi" : `${meta.label} için son adım`}
              </h1>
              <p className="mt-2 text-sm text-[#61748f]">
                {completed
                  ? "Moderasyon süreci genellikle 1–2 iş günü sürer."
                  : "Kampanya nedeniyle ilan ücreti bugün için 0 TL. Onayladıktan sonra ilanınız kaydedilir ve incelemeye alınır."}
              </p>
            </div>

            <div className="rounded-xl border border-[#ffd9c4] bg-[#fff7f2] p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#bc4f0d]">Kampanyalı tutar</p>
                  <p className="mt-1 text-3xl font-extrabold text-[#F26A1B]">0 TL</p>
                </div>
                <p className="pb-1 text-sm font-semibold text-[#7A8CA5] line-through">2.500 TL</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#e8edf3] bg-[#f8fafc] p-4 text-sm text-[#38506e]">
              <p>
                <span className="font-semibold text-[#0F2A4A]">Ödeme zamanı:</span>{" "}
                {formatDateTime(dueAt)} tarihine kadar
              </p>
              <p className="mt-1 text-xs text-[#7A8CA5]">Başlangıç: {formatDateTime(startedAt)}</p>
              {listingId ? (
                <p className="mt-2 text-xs text-[#61748f]">
                  İlan kodu: <span className="font-semibold text-[#0F2A4A]">{listingId}</span>
                </p>
              ) : null}
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <span className="mt-0.5 text-amber-500" aria-hidden="true">
                ⚠
              </span>
              <p className="text-xs leading-5 text-amber-900">
                İlanınız yalnızca ödeme onayından sonra kaydedilir ve moderasyon ekibine iletilir. Onay süreci genellikle <strong>1–2 iş günü</strong> içinde tamamlanır.
              </p>
            </div>

            {isDraftMode && !hasDraft ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                İlan bilgisi bulunamadı. Lütfen formu tekrar doldurun.
              </p>
            ) : null}

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              {completed ? (
                <Link
                  href={meta.successHref}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#0F2A4A] px-5 py-3 text-sm font-bold !text-white visited:!text-white hover:!text-white"
                >
                  İlanlarıma git
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleConfirm()}
                  disabled={!canConfirm || confirming}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#F26A1B] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(242,106,27,0.28)] transition hover:bg-[#dd5f15] disabled:opacity-60"
                >
                  Ödemeyi onayla ve incelemeye gönder
                </button>
              )}
              <Link
                href={isDraftMode ? meta.formHref : meta.browseHref}
                className="inline-flex items-center justify-center rounded-xl border border-[#d3dcea] px-5 py-3 text-sm font-bold text-[#0F2A4A] transition hover:border-[#0F2A4A]"
              >
                {isDraftMode ? "Forma dön" : "Vazgeç"}
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
