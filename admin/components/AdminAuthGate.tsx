"use client";

import Link from "next/link";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { canAccessAdminByEmail } from "@/lib/adminAccess";
import { auth } from "@/lib/firebase";

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p style={{ textAlign: "center", padding: "40px", color: "#61748f" }}>Kontrol ediliyor...</p>;
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 560, margin: "40px auto", background: "#fff", border: "1px solid #dbe2ea", borderRadius: 14, padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Admin girisi gerekiyor</h2>
        <p style={{ color: "#61748f" }}>Devam etmek icin once giris yapin.</p>
        <Link href="/login" style={{ display: "inline-block", background: "#0f2a4a", color: "#fff", padding: "10px 14px", borderRadius: 10, fontWeight: 700 }}>
          Login sayfasina git
        </Link>
      </div>
    );
  }

  if (!canAccessAdminByEmail(user.email)) {
    return (
      <div style={{ maxWidth: 560, margin: "40px auto", background: "#fff", border: "1px solid #f3c5c5", borderRadius: 14, padding: 20 }}>
        <h2 style={{ marginTop: 0, color: "#9f1239" }}>Yetkin yok</h2>
        <p style={{ color: "#61748f" }}>
          Bu hesap admin listesinde degil. `NEXT_PUBLIC_ADMIN_EMAILS` listesine email eklenmeli.
        </p>
        <button
          type="button"
          onClick={() => void signOut(auth)}
          style={{ background: "#fff", border: "1px solid #d3dcea", borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}
        >
          Cikis yap
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
