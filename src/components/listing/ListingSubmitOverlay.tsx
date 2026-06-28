"use client";

import Image from "next/image";

type Props = {
  title?: string;
  subtitle?: string;
};

export default function ListingSubmitOverlay({
  title = "İlanınız hazırlanıyor",
  subtitle = "Görselleriniz güvenle yükleniyor. Bu işlem biraz sürebilir; lütfen sayfayı kapatmayın.",
}: Props) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white/92 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center px-6 text-center">
        <span className="inline-flex h-20 w-20 animate-spin items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-[#0F2A4A]/15 shadow-[0_8px_24px_rgba(15,42,74,0.18)]">
          <Image
            src="/android-chrome-512x512.png"
            alt=""
            aria-hidden
            width={512}
            height={512}
            className="h-full w-full object-cover"
            priority
          />
        </span>
        <p className="mt-6 text-xl font-extrabold tracking-tight text-[#0F2A4A]">{title}</p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#61748f]">{subtitle}</p>
      </div>
    </div>
  );
}
