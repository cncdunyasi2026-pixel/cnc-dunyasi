"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { auth } from "@/lib/firebase";

type Props = {
  adminCode: string;
  children: React.ReactNode;
};

export default function AdminAuthGate({ adminCode, children }: Props) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminAccess();

  if (loading || adminLoading) {
    return <p className="px-4 py-10 text-center text-sm text-[#61748f]">Yetki kontrol ediliyor...</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto my-10 max-w-xl rounded-2xl border border-[#dbe2ea] bg-white p-6">
        <h2 className="text-xl font-bold text-[#0F2A4A]">Admin girisi gerekiyor</h2>
        <p className="mt-2 text-sm text-[#61748f]">Devam etmek için admin hesabı ile giriş yap.</p>
        <Link
          href={`/${adminCode}/admin/login`}
          className="mt-4 inline-flex rounded-xl bg-[#0F2A4A] px-4 py-2 text-sm font-bold !text-white visited:!text-white hover:!text-white"
        >
          Login sayfasina git
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto my-10 max-w-xl rounded-2xl border border-red-200 bg-white p-6">
        <h2 className="text-xl font-bold text-red-800">Bu hesabin admin yetkisi yok</h2>
        <p className="mt-2 text-sm text-[#61748f]">
          `users/{'{uid}'}.roles.admin = true` veya `admins/{'{uid}'}` kaydı oluşturarak yetki verebilirsin.
        </p>
        <button
          type="button"
          onClick={() => {
            void signOut(auth).then(() => router.replace("/hesap/giris"));
          }}
          className="mt-4 rounded-xl border border-[#d3dcea] bg-white px-4 py-2 text-sm font-bold text-[#0F2A4A]"
        >
          Cikis yap
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
