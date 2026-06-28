import type { Metadata } from "next";
import "./globals.css";
import FirebaseAnalytics from "@/components/analytics/FirebaseAnalytics";
import AppChrome from "@/components/layout/AppChrome";
import { BRAND_NAME } from "@/lib/constants/brand";

export const metadata: Metadata = {
  title: {
    default: BRAND_NAME,
    template: `%s | ${BRAND_NAME}`,
  },
  description: "İkinci el CNC, teknik servis, yedek parça ve kariyer platformu",
  applicationName: BRAND_NAME,
  openGraph: {
    siteName: BRAND_NAME,
    title: BRAND_NAME,
    description: "İkinci el CNC, teknik servis, yedek parça ve kariyer platformu",
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
      </head>
      <body className="min-h-screen w-full overflow-x-hidden bg-white text-black">
        <FirebaseAnalytics />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
