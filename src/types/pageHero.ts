export type PageHeroId =
  | "home"
  | "ilanlar"
  | "teknik-servis"
  | "yedek-parca"
  | "kariyer";

export type PageHeroContent = {
  eyebrow: string;
  title: string;
  description: string;
  eyebrowColor: string;
  titleColor: string;
  descriptionColor: string;
};

export type PageHeroDefinition = {
  id: PageHeroId;
  label: string;
  description: string;
  variant: "home" | "centered";
  image: string;
  imageAlt: string;
  imageClassName: string;
  defaults: PageHeroContent;
  ctaLabel?: string;
  ctaHref?: string;
};
