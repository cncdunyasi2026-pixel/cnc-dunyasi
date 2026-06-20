import Link from "next/link";

type Props = {
  searchParams: Promise<{
    listingId?: string;
    kind?: string;   // ads | technical | spare | job
    slug?: string;   // marketplace / job ilanlarında detay linki için
  }>;
};

type KindMeta = {
  eyebrow: string;
  label: string;
  viewHref: (listingId: string, slug: string) => string;
  browseHref: string;
};

const KIND_META: Record<string, KindMeta> = {
  ads: {
    eyebrow: "İKİNCİ EL CNC",
    label: "Tezgah ilanın",
    // pending ilan /ilan/[id] sayfasında görünmez → owner önizleme sayfasına yönlendir
    viewHref: (id) => `/hesap/ilanlarim/${id}`,
    browseHref: "/ilanlar",
  },
  technical: {
    eyebrow: "TEKNİK SERVİS",
    label: "Servis profilin",
    viewHref: (_, slug) => (slug ? `/kategori/teknik-servis/${slug}` : "/kategori/teknik-servis"),
    browseHref: "/kategori/teknik-servis",
  },
  spare: {
    eyebrow: "YEDEK PARÇA",
    label: "Firma profilin",
    viewHref: (_, slug) => (slug ? `/kategori/yedek-parca/${slug}` : "/kategori/yedek-parca"),
    browseHref: "/kategori/yedek-parca",
  },
  job: {
    eyebrow: "KARİYER",
    label: "İş ilanın",
    viewHref: (_, slug) => (slug ? `/kariyer/${slug}` : "/kariyer"),
    browseHref: "/kariyer",
  },
};

const DEFAULT_META = KIND_META.ads;

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function OdemePage({ searchParams }: Props) {
  const { listingId, kind = "ads", slug = "" } = await searchParams;
  const meta = KIND_META[kind] ?? DEFAULT_META;

  const startedAt = Date.now();
  const dueAt = startedAt + 24 * 60 * 60 * 1000;
  const viewHref = listingId
    ? meta.viewHref(listingId, slug)
    : meta.browseHref;

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
      <div className="space-y-5 rounded-2xl border border-[#dbe2ea] bg-white p-6 shadow-sm">

        {/* ── Başlık ──────────────────────────────────────── */}
        <div className="text-center">
          <p className="text-xs font-semibold tracking-[0.16em] text-[#7A8CA5]">
            {meta.eyebrow} · ÖDEME ADIMI
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#0F2A4A]">
            {meta.label} yayınlanmaya hazır
          </h1>
          <p className="mt-2 text-sm text-[#61748f]">
            Kampanya nedeniyle ilan ücreti bugün için 0 TL.
          </p>
        </div>

        {/* ── Fiyat ───────────────────────────────────────── */}
        <div className="rounded-xl border border-[#ffd9c4] bg-[#fff7f2] p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold text-[#bc4f0d]">Kampanyalı tutar</p>
              <p className="mt-1 text-3xl font-extrabold text-[#F26A1B]">0 TL</p>
            </div>
            <p className="pb-1 text-sm font-semibold text-[#7A8CA5] line-through">2.500 TL</p>
          </div>
        </div>

        {/* ── Süre ────────────────────────────────────────── */}
        <div className="rounded-xl border border-[#e8edf3] bg-[#f8fafc] p-4 text-sm text-[#38506e]">
          <p>
            <span className="font-semibold text-[#0F2A4A]">Ödeme zamanı:</span>{" "}
            {formatDateTime(dueAt)} tarihine kadar
          </p>
          <p className="mt-1 text-xs text-[#7A8CA5]">
            Başlangıç: {formatDateTime(startedAt)}
          </p>
          {listingId ? (
            <p className="mt-2 text-xs text-[#61748f]">
              İlan kodu:{" "}
              <span className="font-semibold text-[#0F2A4A]">{listingId}</span>
            </p>
          ) : null}
        </div>

        {/* ── Onay notu ───────────────────────────────────── */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <span className="mt-0.5 text-amber-500" aria-hidden="true">⚠</span>
          <p className="text-xs leading-5 text-amber-900">
            İlanın ödeme tamamlandıktan sonra moderasyon ekibine iletilir.
            Onay süreci genellikle <strong>1–2 iş günü</strong> içinde tamamlanır.
          </p>
        </div>

        {/* ── Butonlar ────────────────────────────────────── */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={viewHref}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#0F2A4A] px-5 py-3 text-sm font-bold !text-white visited:!text-white hover:!text-white focus-visible:!text-white"
          >
            İlanı görüntüle
          </Link>
          <Link
            href={meta.browseHref}
            className="inline-flex items-center justify-center rounded-xl border border-[#d3dcea] px-5 py-3 text-sm font-bold text-[#0F2A4A] transition hover:border-[#0F2A4A]"
          >
            Vazgeç
          </Link>
        </div>
      </div>
    </section>
  );
}
