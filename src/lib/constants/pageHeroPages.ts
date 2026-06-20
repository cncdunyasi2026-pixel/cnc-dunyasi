import type { PageHeroDefinition, PageHeroId } from "@/types/pageHero";

export const PAGE_HERO_DEFINITIONS: PageHeroDefinition[] = [
  {
    id: "home",
    label: "Anasayfa",
    description: "Üst hero alanı — sol hizalı başlıklar",
    variant: "home",
    image: "/banner_1.jpg",
    imageAlt: "Cncdunyam Hero",
    imageClassName: "h-[280px] w-full object-cover sm:h-[360px] lg:h-[460px]",
    defaults: {
      eyebrow: "TÜRKİYE'NİN",
      title: "CNC BORSASI",
      description: "Güvenilir alım satım, hızlı teklif ve uzman ekspertiz desteği.",
      eyebrowColor: "#7A8CA5",
      titleColor: "#FFFFFF",
      descriptionColor: "rgba(255,255,255,0.8)",
    },
  },
  {
    id: "ilanlar",
    label: "İkinci El CNC",
    description: "/ilanlar sayfası banner metinleri",
    variant: "centered",
    image: "/banner_1.jpg",
    imageAlt: "CNC platform tanıtım görseli",
    imageClassName: "h-[230px] w-full object-cover sm:h-[280px]",
    defaults: {
      eyebrow: "CNC DÜNYASI İLAN PLATFORMU",
      title: "Tezgahını Doğru Alıcıyla Buluştur",
      description: "Dakikalar içinde ilanını yayınla, binlerce profesyonel alıcıya hemen ulaş.",
      eyebrowColor: "#7A8CA5",
      titleColor: "#FFFFFF",
      descriptionColor: "rgba(255,255,255,0.85)",
    },
    ctaLabel: "HEMEN ÜCRETSİZ İLAN VER",
    ctaHref: "/ilan-ver/ikinci-el",
  },
  {
    id: "teknik-servis",
    label: "Teknik Servis",
    description: "/kategori/teknik-servis banner metinleri",
    variant: "centered",
    image: "/teknik_servis.png",
    imageAlt: "Teknik servis banner",
    imageClassName: "h-[230px] w-full object-cover sm:h-[280px]",
    defaults: {
      eyebrow: "CNC DÜNYASI SERVİS AĞI",
      title: "Uzmana Hemen Ulaş, Üretimi Durdurma",
      description: "Teknik servis ilanlarını incele, bölgendeki uzman ekiplerle hızlı iletişime geç.",
      eyebrowColor: "#7A8CA5",
      titleColor: "#FFFFFF",
      descriptionColor: "rgba(255,255,255,0.85)",
    },
    ctaLabel: "SERVİS İLANI OLUŞTUR",
    ctaHref: "/ilan-ver/teknik-servis",
  },
  {
    id: "yedek-parca",
    label: "Yedek Parça",
    description: "/kategori/yedek-parca banner metinleri",
    variant: "centered",
    image: "/yedek_parca.png",
    imageAlt: "Yedek parça banner",
    imageClassName: "h-[230px] w-full object-cover sm:h-[280px]",
    defaults: {
      eyebrow: "CNC DÜNYASI TEDARİK AĞI",
      title: "Doğru Yedek Parçaya Tek Noktadan Ulaş",
      description: "Tedarikçi firmaları karşılaştır, stok ve uzmanlık bilgilerine hızla eriş.",
      eyebrowColor: "#7A8CA5",
      titleColor: "#FFFFFF",
      descriptionColor: "rgba(255,255,255,0.85)",
    },
    ctaLabel: "FİRMA PROFİLİ OLUŞTUR",
    ctaHref: "/ilan-ver/yedek-parca",
  },
  {
    id: "kariyer",
    label: "Kariyer",
    description: "/kariyer sayfası banner metinleri",
    variant: "centered",
    image: "/kariyer.png",
    imageAlt: "Kariyer banner",
    imageClassName: "h-[230px] w-full object-cover sm:h-[280px]",
    defaults: {
      eyebrow: "CNC DÜNYASI KARİYER",
      title: "Doğru Pozisyonla Kariyerinde İleri Geç",
      description: "İş ilanlarını incele, uzmanlığını değerlendirecek firmalarla hızlı bağlantı kur.",
      eyebrowColor: "#7A8CA5",
      titleColor: "#FFFFFF",
      descriptionColor: "rgba(255,255,255,0.85)",
    },
    ctaLabel: "İŞ İLANI VER",
    ctaHref: "/kariyer/is-ilani-ver",
  },
];

export function getPageHeroDefinition(id: PageHeroId): PageHeroDefinition {
  const found = PAGE_HERO_DEFINITIONS.find((page) => page.id === id);
  if (!found) {
    throw new Error(`Unknown page hero id: ${id}`);
  }
  return found;
}
