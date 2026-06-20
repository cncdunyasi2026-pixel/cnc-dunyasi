"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";

/* ── Yardımcı bileşenler ────────────────────────────────────── */

function SectionCard({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#dbe2ea] bg-white p-6 shadow-sm">
      <div className="mb-5 border-b border-[#eef2f6] pb-4">
        <h2 className="text-base font-extrabold text-[#0F2A4A]">{title}</h2>
        {description && <p className="mt-1 text-sm text-[#7A8CA5]">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-bold text-[#38506e]">{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-xl border px-3 text-sm outline-none transition ${
        props.disabled
          ? "cursor-not-allowed border-[#e8edf3] bg-[#f8fafc] text-[#7A8CA5]"
          : "border-[#d3dcea] bg-white text-[#0F2A4A] focus:border-[#0F2A4A] focus:ring-2 focus:ring-[#0F2A4A]/10"
      } ${props.className ?? ""}`}
    />
  );
}

function Alert({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-900"
      }`}
    >
      {type === "success" ? (
        <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <span>{message}</span>
    </div>
  );
}

/* ── Profil güncelleme formu ─────────────────────────────────── */

function ProfileForm({ displayName, email }: { displayName: string; email: string }) {
  const [name, setName] = useState(displayName);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isDirty = name.trim() !== displayName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Oturum bulunamadı.");
      await updateProfile(currentUser, { displayName: trimmed });
      setResult({ type: "success", message: "Adınız güncellendi." });
    } catch (err) {
      setResult({
        type: "error",
        message: err instanceof Error ? err.message : "Güncelleme başarısız.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <FieldLabel>Ad Soyad</FieldLabel>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Adınızı girin"
          maxLength={60}
        />
      </div>

      <div>
        <FieldLabel>E-posta adresi</FieldLabel>
        <div className="relative">
          <Input type="email" value={email} disabled />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-[#eef2f8] px-2 py-0.5 text-[10px] font-bold text-[#7A8CA5]">
            Değiştirilemez
          </span>
        </div>
        <p className="mt-1.5 text-xs text-[#7A8CA5]">
          E-posta adresi hesap güvenliği için değiştirilemez.
        </p>
      </div>

      {result && <Alert type={result.type} message={result.message} />}

      <button
        type="submit"
        disabled={loading || !isDirty || !name.trim()}
        className="rounded-xl bg-[#0F2A4A] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#12335c] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Kaydediliyor..." : "Değişiklikleri kaydet"}
      </button>
    </form>
  );
}

/* ── Şifre değiştirme formu ─────────────────────────────────── */

function PasswordForm() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const strength = (() => {
    if (newPw.length === 0) return 0;
    let s = 0;
    if (newPw.length >= 8) s++;
    if (/[A-Z]/.test(newPw)) s++;
    if (/[0-9]/.test(newPw)) s++;
    if (/[^A-Za-z0-9]/.test(newPw)) s++;
    return s;
  })();

  const strengthLabel = ["", "Zayıf", "Orta", "İyi", "Güçlü"][strength];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-emerald-400"][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (newPw.length < 8) {
      setResult({ type: "error", message: "Yeni şifre en az 8 karakter olmalıdır." });
      return;
    }
    if (newPw !== confirmPw) {
      setResult({ type: "error", message: "Yeni şifreler eşleşmiyor." });
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error("Oturum bulunamadı.");

      const credential = EmailAuthProvider.credential(currentUser.email, currentPw);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPw);

      setResult({ type: "success", message: "Şifreniz başarıyla güncellendi." });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setResult({ type: "error", message: "Mevcut şifre hatalı." });
      } else if (code === "auth/requires-recent-login") {
        setResult({ type: "error", message: "Bu işlem için yeniden giriş yapmanız gerekiyor." });
      } else {
        setResult({
          type: "error",
          message: err instanceof Error ? err.message : "Şifre güncellenemedi.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mevcut şifre */}
      <div>
        <FieldLabel>Mevcut şifre</FieldLabel>
        <div className="relative">
          <Input
            type={showCurrent ? "text" : "password"}
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8CA5] hover:text-[#0F2A4A]"
          >
            {showCurrent ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Yeni şifre */}
      <div>
        <FieldLabel>Yeni şifre</FieldLabel>
        <div className="relative">
          <Input
            type={showNew ? "text" : "password"}
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="En az 8 karakter"
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8CA5] hover:text-[#0F2A4A]"
          >
            {showNew ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {/* Güç göstergesi */}
        {newPw.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    i <= strength ? strengthColor : "bg-[#e8edf3]"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-[#7A8CA5]">{strengthLabel}</span>
          </div>
        )}
      </div>

      {/* Şifre tekrar */}
      <div>
        <FieldLabel>Yeni şifre (tekrar)</FieldLabel>
        <Input
          type="password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          className={
            confirmPw.length > 0
              ? newPw === confirmPw
                ? "border-emerald-300 focus:border-emerald-400"
                : "border-red-300 focus:border-red-400"
              : ""
          }
        />
        {confirmPw.length > 0 && newPw !== confirmPw && (
          <p className="mt-1.5 text-xs text-red-500">Şifreler eşleşmiyor.</p>
        )}
      </div>

      {result && <Alert type={result.type} message={result.message} />}

      <button
        type="submit"
        disabled={loading || !currentPw || !newPw || !confirmPw}
        className="rounded-xl bg-[#0F2A4A] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#12335c] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Güncelleniyor..." : "Şifreyi güncelle"}
      </button>
    </form>
  );
}

/* ── Ana sayfa ──────────────────────────────────────────────── */

export default function AccountSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/hesap/giris?redirect=/hesap/ayarlar");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="mx-auto flex max-w-2xl justify-center px-4 py-16">
        <p className="text-sm font-semibold text-[#7A8CA5]">Yükleniyor...</p>
      </div>
    );
  }

  /* Google gibi OAuth ile giriş yapıldıysa şifre formu gösterilmez */
  const isPasswordProvider = user.providerData.some(
    (p) => p.providerId === "password",
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      {/* Başlık */}
      <div className="mb-8">
        <Link
          href="/hesap/profil"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A8CA5] hover:text-[#0F2A4A]"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Profil'e dön
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.18em] text-[#7A8CA5]">HESABIM</p>
        <h1 className="mt-1 text-2xl font-extrabold text-[#0F2A4A] md:text-3xl">Hesap Ayarları</h1>
        <p className="mt-2 text-sm text-[#5f6f86]">Kişisel bilgilerinizi ve güvenlik ayarlarınızı yönetin.</p>
      </div>

      <div className="space-y-6">
        {/* Profil bilgileri */}
        <SectionCard
          title="Profil Bilgileri"
          description="Adınız platformdaki ilanlarınızda ve profilinizde görünür."
        >
          <ProfileForm
            displayName={user.displayName ?? ""}
            email={user.email ?? ""}
          />
        </SectionCard>

        {/* Şifre değiştir */}
        {isPasswordProvider ? (
          <SectionCard
            title="Şifre Değiştir"
            description="Güvenliğiniz için düzenli şifre değişikliği önerilir."
          >
            <PasswordForm />
          </SectionCard>
        ) : (
          <SectionCard title="Şifre Değiştir">
            <div className="flex items-start gap-3 rounded-xl border border-[#dbe2ea] bg-[#f8fafc] p-4">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-[#7A8CA5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-[#5f6f86]">
                Hesabınız sosyal giriş (Google vb.) ile bağlı olduğundan şifre değişikliği mevcut değil.
              </p>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
