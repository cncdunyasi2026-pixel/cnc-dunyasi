export type FooterLink = {
  label: string;
  href: string;
  enabled: boolean;
};

export type FooterLegalDocument = {
  title: string;
  body: string;
};

export type FooterSettings = {
  tagline: string;
  contactEmail: string;
  contactNote: string;
  instagramUrl: string;
  linkedinUrl: string;
  platformLinks: FooterLink[];
  accountLinks: FooterLink[];
  corporateLinks: FooterLink[];
  bottomLinks: FooterLink[];
  kvkk: FooterLegalDocument;
  userAgreement: FooterLegalDocument;
};
