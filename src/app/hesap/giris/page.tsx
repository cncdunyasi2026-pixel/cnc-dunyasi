"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
// import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { getSafePostAuthRedirect, withRedirectQuery } from "@/lib/authRedirect";
import {
  formatAuthError,
  sendPasswordReset,
  signInWithEmail,
  // signInWithGoogle,
} from "@/services/userService";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectRaw = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const busy = loading || forgotLoading;
  const afterAuthPath = getSafePostAuthRedirect(redirectRaw);
  const kayitHref = withRedirectQuery("/hesap/kayit", redirectRaw);

  const handleForgotPassword = async () => {
    setError(null);
    setResetSent(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Şifre sıfırlama için önce e-posta adresini girin.");
      return;
    }
    setForgotLoading(true);
    try {
      await sendPasswordReset(trimmed);
      setResetSent(
        "Bu adres kayıtlıysa sıfırlama bağlantısı gönderildi. Gelen kutunu ve gerekiyorsa spam klasörünü kontrol et.",
      );
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setForgotLoading(false);
    }
  };

  // const handleGoogle = async () => {
  //   setError(null);
  //   setResetSent(null);
  //   setGoogleLoading(true);
  //   try {
  //     await signInWithGoogle();
  //     router.push(afterAuthPath);
  //     router.refresh();
  //   } catch (err) {
  //     setError(formatAuthError(err));
  //   } finally {
  //     setGoogleLoading(false);
  //   }
  // };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResetSent(null);
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.push(afterAuthPath);
      router.refresh();
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] bg-[#f3f5f8] py-10 md:py-14">
      <div className="mx-auto w-full max-w-md px-4">
        <div className="overflow-hidden rounded-2xl border border-[#dbe2ea] bg-white shadow-[0_12px_40px_rgba(15,42,74,0.1)]">
          <div className="bg-gradient-to-r from-[#0F2A4A] to-[#1A4A7A] px-6 py-8 text-center text-white">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-[#7A8CA5]">CNC DÜNYAM</p>
            <h1 className="mt-2 text-2xl font-extrabold">Giriş yap</h1>
            <p className="mt-2 text-sm text-white/80">Hesabına giriş yap, ilanları ve mesajları yönet.</p>
          </div>

          <div className="p-6">
            {resetSent ? (
              <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">{resetSent}</p>
            ) : null}
            {error ? (
              <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>
            ) : null}

            {/* Google ile giriş — şimdilik kapalı
            <GoogleAuthButton
              label="Google ile giriş yap"
              loading={googleLoading}
              disabled={busy}
              onClick={handleGoogle}
            />

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <div className="w-full border-t border-[#dbe2ea]" />
              </div>
              <div className="relative flex justify-center text-[11px] font-bold uppercase tracking-[0.14em]">
                <span className="bg-white px-3 text-[#7A8CA5]">veya e-posta ile</span>
              </div>
            </div>
            */}

            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label htmlFor="login-email" className="mb-1 block text-xs font-semibold text-[#61748f]">
                  E-posta
                </label>
                <input
                  id="login-email"
                  className="h-11 w-full rounded-xl border border-[#d3dcea] bg-white px-3 text-sm text-[#0F2A4A] outline-none transition focus:border-[#0F2A4A] focus:ring-2 focus:ring-[#0F2A4A]/15"
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label htmlFor="login-password" className="text-xs font-semibold text-[#61748f]">
                    Şifre
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={busy}
                    className="text-xs font-semibold text-[#0F2A4A] underline-offset-2 hover:text-[#F26A1B] hover:underline disabled:opacity-50"
                  >
                    {forgotLoading ? "Gönderiliyor..." : "Şifremi unuttum"}
                  </button>
                </div>
                <input
                  id="login-password"
                  className="h-11 w-full rounded-xl border border-[#d3dcea] bg-white px-3 text-sm text-[#0F2A4A] outline-none transition focus:border-[#0F2A4A] focus:ring-2 focus:ring-[#0F2A4A]/15"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-gradient-to-r from-[#0F2A4A] to-[#1A4A7A] px-4 py-3 text-sm font-bold !text-white shadow-[0_8px_20px_rgba(15,42,74,0.25)] transition hover:translate-y-[-1px] hover:shadow-[0_10px_24px_rgba(15,42,74,0.3)] disabled:opacity-60"
              >
                {loading ? "Giriş yapılıyor..." : "Giriş yap"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#5f6f86]">
              Hesabın yok mu?{" "}
              <Link href={kayitHref} className="font-bold text-[#0F2A4A] underline-offset-2 hover:text-[#F26A1B] hover:underline">
                Kayıt ol
              </Link>
            </p>

            <div className="mt-6 border-t border-[#eef2f6] pt-6 text-center">
              <Link href="/" className="text-xs font-semibold text-[#7A8CA5] hover:text-[#0F2A4A]">
                ← Ana sayfaya dön
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center bg-[#f3f5f8]">
          <p className="text-sm font-semibold text-[#7A8CA5]">Yükleniyor...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
