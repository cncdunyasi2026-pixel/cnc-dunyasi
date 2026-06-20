import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-[#163c64] bg-[#0F2A4A]">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 px-4 py-6 text-sm text-white/80 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-lg font-extrabold text-white">
            cnc<span className="text-[#7A8CA5]">dunyasi</span>.com
          </p>
          <p className="mt-1 text-xs text-white/70">İkinci el CNC, teknik servis, yedek parça ve kariyer platformu.</p>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/80 md:justify-end">
          <Link href="/ilanlar" className="hover:text-white">
            İKİNCİ EL CNC
          </Link>
          <Link href="/kategori/teknik-servis" className="hover:text-white">
            TEKNİK SERVİS
          </Link>
          <Link href="/kategori/yedek-parca" className="hover:text-white">
            YEDEK PARÇA
          </Link>
          <Link href="/kariyer" className="hover:text-white">
            KARİYER
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#0c223c]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-3 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Cncdunyasi</span>
          <span>Tüm hakları saklıdır.</span>
        </div>
      </div>
    </footer>
  );
}
