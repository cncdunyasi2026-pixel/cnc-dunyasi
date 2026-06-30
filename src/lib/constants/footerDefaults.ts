import type { FooterSettings } from "@/types/footer";

export const FOOTER_DOC_ID = "main";

export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  tagline: "İkinci el CNC, teknik servis, yedek parça ve kariyer platformu.",
  contactEmail: "info@cncdunyam.com",
  contactNote: "Türkiye geneli hizmet",
  instagramUrl: "",
  linkedinUrl: "",
  platformLinks: [
    { label: "İkinci El CNC", href: "/ilanlar", enabled: true },
    { label: "Teknik Servis", href: "/kategori/teknik-servis", enabled: true },
    { label: "Yedek Parça", href: "/kategori/yedek-parca", enabled: true },
    { label: "Kariyer", href: "/kariyer", enabled: true },
  ],
  accountLinks: [
    { label: "İlan Ver", href: "/ilan-ver", enabled: true },
    { label: "Hesabım", href: "/hesap/profil", enabled: true },
    { label: "Mesajlarım", href: "/hesap/mesajlar", enabled: true },
  ],
  corporateLinks: [
    { label: "KVKK", href: "/kvkk", enabled: true },
    { label: "Kullanıcı Sözleşmesi", href: "/kullanici-sozlesmesi", enabled: true },
  ],
  bottomLinks: [
    { label: "KVKK", href: "/kvkk", enabled: true },
    { label: "Kullanıcı Sözleşmesi", href: "/kullanici-sozlesmesi", enabled: true },
  ],
  kvkk: {
    title: "KVKK Aydınlatma Metni",
    body: "",
  },
  userAgreement: {
    title: "Kullanıcı Sözleşmesi",
    body: "",
  },
};
