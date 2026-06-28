import Link from "next/link";
import HomepageSections from "@/components/home/HomepageSections";
import PageHeroBanner from "@/components/page/PageHeroBanner";
import PageContentProvider from "@/components/page/PageContentProvider";
import { BRAND_NAME } from "@/lib/constants/brand";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: BRAND_NAME,
  absoluteTitle: true,
  path: "/",
});

export default function HomePage() {
  return (
    <div className="relative overflow-x-hidden bg-[#f3f5f8] pb-12">
      <h1 className="sr-only">{BRAND_NAME}</h1>
      <PageHeroBanner pageId="home" />

      <div className="mx-auto mt-3 w-full max-w-7xl px-4 md:hidden">
        <div className="rounded-2xl bg-white p-5 shadow-lg">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-[#7A8CA5]">HIZLI BAŞLA</p>
          <h2 className="mt-1 text-base font-extrabold text-[#0F2A4A]">İlanını Hemen Oluştur</h2>
          <p className="mt-1 text-xs text-[#7A8CA5]">Dakikalar içinde ilanını yayınla, alıcılarla buluş.</p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/ilan-ver/ikinci-el" className="flex items-center gap-2 rounded-xl border border-[#dbe2ea] px-3 py-2.5 transition hover:border-[#0F2A4A]/30 hover:bg-[#f4f7fb]">
              <span className="text-lg">🏭</span>
              <span className="text-xs font-bold text-[#0F2A4A]">İkinci El CNC</span>
            </Link>
            <Link href="/ilan-ver/teknik-servis" className="flex items-center gap-2 rounded-xl border border-[#dbe2ea] px-3 py-2.5 transition hover:border-[#0F2A4A]/30 hover:bg-[#f4f7fb]">
              <span className="text-lg">🔧</span>
              <span className="text-xs font-bold text-[#0F2A4A]">Teknik Servis</span>
            </Link>
            <Link href="/ilan-ver/yedek-parca" className="flex items-center gap-2 rounded-xl border border-[#dbe2ea] px-3 py-2.5 transition hover:border-[#0F2A4A]/30 hover:bg-[#f4f7fb]">
              <span className="text-lg">⚙️</span>
              <span className="text-xs font-bold text-[#0F2A4A]">Yedek Parça</span>
            </Link>
            <Link href="/kariyer/is-ilani-ver" className="flex items-center gap-2 rounded-xl border border-[#dbe2ea] px-3 py-2.5 transition hover:border-[#0F2A4A]/30 hover:bg-[#f4f7fb]">
              <span className="text-lg">💼</span>
              <span className="text-xs font-bold text-[#0F2A4A]">İş İlanı</span>
            </Link>
          </div>
        </div>
      </div>

      <PageContentProvider pageId="home">
        <HomepageSections />
      </PageContentProvider>

      <section className="mx-auto mt-6 w-full max-w-7xl px-4">
        <div className="overflow-hidden rounded-2xl border border-[#1b4a78] bg-gradient-to-r from-[#0F2A4A] via-[#11345b] to-[#0F2A4A] text-white shadow-[0_12px_30px_rgba(15,42,74,0.22)]">
          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-[1.2fr_1.8fr] md:p-6">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-[#7A8CA5]">HIZLI TEDARIK MERKEZI</p>
              <h4 className="mt-1 text-2xl font-extrabold leading-tight">YEDEK PARÇA MARKETİ</h4>
              <p className="mt-2 text-sm text-white/80">CNC bakım, takım ve sarf malzemeleri tek noktada.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/kategori/yedek-parca"
                  className="rounded bg-[#F26A1B] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#dd5f15]"
                >
                  HEMEN GÖZ AT
                </Link>
                <Link
                  href="/kategori/teknik-servis"
                  className="rounded border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  SERVİS BUL
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-white/15 bg-white/5 p-3">
                <p className="text-[11px] font-semibold text-[#7A8CA5]">GÜVENLİ EKSPERTİZ</p>
                <p className="mt-1 text-sm font-semibold text-white/90">Onaylı uzman ağımızla doğrulanmış tedarik.</p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/5 p-3">
                <p className="text-[11px] font-semibold text-[#7A8CA5]">ŞEFFAF FİYATLANDIRMA</p>
                <p className="mt-1 text-sm font-semibold text-white/90">Parça ve servis bedellerinde net teklif süreci.</p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/5 p-3">
                <p className="text-[11px] font-semibold text-[#7A8CA5]">GENİŞ TEDARİK AĞI</p>
                <p className="mt-1 text-sm font-semibold text-white/90">Türkiye geneline hızlı sevkiyat ve destek.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 bg-[#0c223c] px-5 py-3 text-xs text-white/70 md:px-6">
            Stoktan sevkiyat, uzman destek ve güvenli alışveriş deneyimi.
          </div>
        </div>
      </section>
    </div>
  );
}
