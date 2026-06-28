import type { Metadata } from "next";
import "./globals.css";
import FirebaseAnalytics from "@/components/analytics/FirebaseAnalytics";
import AppChrome from "@/components/layout/AppChrome";
import StructuredData from "@/components/seo/StructuredData";
import { BRAND_NAME } from "@/lib/constants/brand";
import { DEFAULT_DESCRIPTION, SITE_URL } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: BRAND_NAME,
    template: `%s | ${BRAND_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: BRAND_NAME,
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  openGraph: {
    siteName: BRAND_NAME,
    title: BRAND_NAME,
    description: DEFAULT_DESCRIPTION,
    locale: "tr_TR",
    type: "website",
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title: BRAND_NAME,
    description: DEFAULT_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="overflow-x-hidden">
      <head>
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        <StructuredData />
      </head>
      <body className="min-h-screen w-full overflow-x-hidden bg-white text-black">
        <FirebaseAnalytics />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
