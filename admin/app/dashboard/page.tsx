"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import AdminAuthGate from "@/components/AdminAuthGate";
import { auth } from "@/lib/firebase";

export default function DashboardPage() {
  return (
    <AdminAuthGate>
      <main style={{ maxWidth: 980, margin: "30px auto", padding: "0 16px" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.12em", color: "#61748f", fontWeight: 700 }}>ADMIN PANEL</p>
            <h1 style={{ margin: "4px 0 0 0" }}>CNCdunyam Yonetim</h1>
          </div>
          <button
            type="button"
            onClick={() => void signOut(auth)}
            style={{ border: "1px solid #d3dcea", background: "#fff", borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}
          >
            Cikis yap
          </button>
        </header>

        <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <Link href="#" style={{ background: "#fff", border: "1px solid #dbe2ea", borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Ilan Moderasyonu</h3>
            <p style={{ margin: 0, color: "#61748f" }}>Pending / update_pending ilanlari yonet.</p>
          </Link>
          <Link href="#" style={{ background: "#fff", border: "1px solid #dbe2ea", borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Raporlar</h3>
            <p style={{ margin: 0, color: "#61748f" }}>Kullanici sikayetlerini incele.</p>
          </Link>
          <Link href="#" style={{ background: "#fff", border: "1px solid #dbe2ea", borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Audit Log</h3>
            <p style={{ margin: 0, color: "#61748f" }}>Yonetici islemlerini izle.</p>
          </Link>
        </section>
      </main>
    </AdminAuthGate>
  );
}
