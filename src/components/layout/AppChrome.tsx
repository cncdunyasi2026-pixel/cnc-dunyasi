"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

type Props = {
  children: React.ReactNode;
};

export default function AppChrome({ children }: Props) {
  const pathname = usePathname();
  const isAdminRoute = /^\/[^/]+\/admin(\/|$)/.test(pathname);
  const isChatPage = /^\/hesap\/mesajlar\/.+/.test(pathname);

  if (isAdminRoute) {
    return <main className="min-h-screen w-full bg-[#0a1222] text-white">{children}</main>;
  }

  if (isChatPage) {
    return (
      <div className="overflow-x-hidden">
        <Header />
        <main className="w-full max-w-full overflow-x-hidden">{children}</main>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden">
      <Header />
      <main className="w-full max-w-full overflow-x-hidden pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
