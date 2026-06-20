import Link from "next/link";

const flows = [
  {
    href: "/ilan-ver/ikinci-el",
    badge: "TEZGAH SATIŞI",
    title: "İkinci el CNC ilanı",
    description: "Tezgahını fotoğrafları ve fiyatla yayınla; doğru alıcıya ulaş.",
    accent: "from-[#0F2A4A] to-[#1A4A7A]",
  },
  {
    href: "/ilan-ver/teknik-servis",
    badge: "SERVİS AĞI",
    title: "Teknik servis profili",
    description: "Uzmanlık alanların ve iletişim bilginle servis ilanı oluştur.",
    accent: "from-[#1A4A7A] to-[#0F2A4A]",
  },
  {
    href: "/ilan-ver/yedek-parca",
    badge: "TEDARİK",
    title: "Yedek parça firması",
    description: "Stok ve ürün gamını tanıtan firma profili ekle.",
    accent: "from-[#0F2A4A] to-[#163d66]",
  },
  {
    href: "/kariyer/is-ilani-ver",
    badge: "KARİYER",
    title: "İş ilanı ver",
    description: "Pozisyon, ücret ve aranan nitelikleri ekleyerek ilanı yayına al.",
    accent: "from-[#F26A1B] to-[#c75512]",
  },
] as const;

export default function IlanVerHubPage() {
  return (
    <div className="min-h-[calc(100vh-12rem)] bg-[#f3f5f8] py-10 md:py-14">
      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="mb-8 text-center md:text-left">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#7A8CA5]">İLAN MERKEZİ</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#0F2A4A] md:text-4xl">İlan ver</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-[#5f6f86] md:mx-0">
            CNC vitrinleri ve kariyer için ilan türlerinden birini seçerek dakikalar içinde oluştur.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {flows.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#dbe2ea] bg-white shadow-[0_12px_36px_rgba(15,42,74,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(15,42,74,0.12)]"
            >
              <div className={`bg-gradient-to-r px-5 py-6 text-white ${item.accent}`}>
                <p className="text-[10px] font-bold tracking-[0.16em] text-white/75">{item.badge}</p>
                <h2 className="mt-2 text-lg font-extrabold leading-snug">{item.title}</h2>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="flex-1 text-sm leading-relaxed text-[#5f6f86]">{item.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#F26A1B]">
                  Devam et
                  <span aria-hidden className="transition group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-[#7A8CA5] md:text-left">
          <Link href="/ilanlar" className="font-semibold hover:text-[#0F2A4A]">
            ← İkinci el CNC vitrinine dön
          </Link>
        </p>
      </div>
    </div>
  );
}
