import type { Metadata } from "next";
import "./globals.css";
import FirebaseAnalytics from "@/components/analytics/FirebaseAnalytics";
import AppChrome from "@/components/layout/AppChrome";

export const metadata: Metadata = {
  title: "Cncdunyam",
  description: "İkinci el CNC, teknik servis, yedek parça ve kariyer platformu",
  applicationName: "Cncdunyam",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen overflow-x-hidden bg-white text-black">
        <FirebaseAnalytics />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
