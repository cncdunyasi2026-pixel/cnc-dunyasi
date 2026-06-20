"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Giris basarisiz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 460, margin: "8vh auto", padding: 20 }}>
      <div style={{ background: "#fff", border: "1px solid #dbe2ea", borderRadius: 14, padding: 20 }}>
        <h1 style={{ marginTop: 0 }}>Admin Login</h1>
        <p style={{ color: "#61748f", marginTop: 0 }}>Yalnizca admin e-posta listesinde olan hesaplar girebilir.</p>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ height: 42, borderRadius: 10, border: "1px solid #d3dcea", padding: "0 12px" }}
          />
          <input
            type="password"
            placeholder="Sifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ height: 42, borderRadius: 10, border: "1px solid #d3dcea", padding: "0 12px" }}
          />
          {error ? <p style={{ margin: 0, color: "#9f1239", fontSize: 13 }}>{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            style={{ height: 42, borderRadius: 10, border: "none", background: "#0f2a4a", color: "#fff", fontWeight: 700 }}
          >
            {loading ? "Giriliyor..." : "Giris yap"}
          </button>
        </form>
      </div>
    </main>
  );
}
