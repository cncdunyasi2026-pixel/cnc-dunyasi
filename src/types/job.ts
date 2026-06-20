export type JobListing = {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string;
  workModel: string;
  /** Pozisyon: admin panelinden yönetilen liste (örn. "CNC Operatörü", "Satış Mühendisi") */
  position?: string;
  /** Deneyim seviyesi: "0-2 Yıl" | "2-5 Yıl" | "5-10 Yıl" | "10+ Yıl" */
  experienceLevel?: string;
  /** @deprecated level yerine position kullanılıyor */
  level: string;
  salary: string;
  postedAt: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  images: string[];
  imagePaths?: string[];
};
