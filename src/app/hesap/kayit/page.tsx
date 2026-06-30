"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
// import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { getSafePostAuthRedirect, withRedirectQuery } from "@/lib/authRedirect";
import { formatAuthError, registerWithEmail /* , signInWithGoogle */ } from "@/services/userService";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectRaw = searchParams.get("redirect");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // const [googleLoading, setGoogleLoading] = useState(false);

  const busy = loading;
  const afterAuthPath = getSafePostAuthRedirect(redirectRaw);
  const girisHref = withRedirectQuery("/hesap/giris", redirectRaw);

  // const handleGoogle = async () => {
  //   setError(null);
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

    if (!firstName.trim() || !lastName.trim()) {
      setError("Ad ve soyad alanları zorunludur.");
      return;
    }
    const phoneCleaned = phone.replace(/\s/g, "");
    if (phoneCleaned && !/^(0|\+90)5\d{9}$/.test(phoneCleaned)) {
      setError("Geçerli bir telefon numarası girin. (05XX XXX XX XX)");
      return;
    }
    if (password !== passwordAgain) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setLoading(true);
    try {
      const displayName = `${firstName.trim()} ${lastName.trim()}`;
      await registerWithEmail(email, password, displayName, phoneCleaned);
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
            <h1 className="mt-2 text-2xl font-extrabold">Kayıt ol</h1>
            <p className="mt-2 text-sm text-white/80">Ücretsiz hesap oluştur, ilan ver ve uzman ağına katıl.</p>
          </div>

          <div className="p-6">
            {error ? (
              <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>
            ) : null}

            {/* Google ile kayıt — şimdilik kapalı
            <GoogleAuthButton
              label="Google ile kayıt ol"
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
              {/* Ad / Soyad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="register-first-name" className="mb-1 block text-xs font-semibold text-[#61748f]">
                    Ad <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="register-first-name"
                    className="h-11 w-full rounded-xl border border-[#d3dcea] bg-white px-3 text-sm text-[#0F2A4A] outline-none transition focus:border-[#0F2A4A] focus:ring-2 focus:ring-[#0F2A4A]/15"
                    type="text"
                    placeholder="Adınız"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="register-last-name" className="mb-1 block text-xs font-semibold text-[#61748f]">
                    Soyad <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="register-last-name"
                    className="h-11 w-full rounded-xl border border-[#d3dcea] bg-white px-3 text-sm text-[#0F2A4A] outline-none transition focus:border-[#0F2A4A] focus:ring-2 focus:ring-[#0F2A4A]/15"
                    type="text"
                    placeholder="Soyadınız"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>

              {/* Telefon */}
              <div>
                <label htmlFor="register-phone" className="mb-1 block text-xs font-semibold text-[#61748f]">
                  Telefon numarası
                </label>
                <input
                  id="register-phone"
                  className="h-11 w-full rounded-xl border border-[#d3dcea] bg-white px-3 text-sm text-[#0F2A4A] outline-none transition focus:border-[#0F2A4A] focus:ring-2 focus:ring-[#0F2A4A]/15"
                  type="tel"
                  placeholder="05XX XXX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>

              {/* E-posta */}
              <div>
                <label htmlFor="register-email" className="mb-1 block text-xs font-semibold text-[#61748f]">
                  E-posta <span className="text-red-500">*</span>
                </label>
                <input
                  id="register-email"
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
                <label htmlFor="register-password" className="mb-1 block text-xs font-semibold text-[#61748f]">
                  Şifre <span className="text-red-500">*</span>
                </label>
                <input
                  id="register-password"
                  className="h-11 w-full rounded-xl border border-[#d3dcea] bg-white px-3 text-sm text-[#0F2A4A] outline-none transition focus:border-[#0F2A4A] focus:ring-2 focus:ring-[#0F2A4A]/15"
                  type="password"
                  placeholder="En az 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label htmlFor="register-password-again" className="mb-1 block text-xs font-semibold text-[#61748f]">
                  Şifre tekrar <span className="text-red-500">*</span>
                </label>
                <input
                  id="register-password-again"
                  className="h-11 w-full rounded-xl border border-[#d3dcea] bg-white px-3 text-sm text-[#0F2A4A] outline-none transition focus:border-[#0F2A4A] focus:ring-2 focus:ring-[#0F2A4A]/15"
                  type="password"
                  placeholder="Şifreni tekrar gir"
                  value={passwordAgain}
                  onChange={(e) => setPasswordAgain(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-[#F26A1B] px-4 py-3 text-sm font-bold !text-white shadow-[0_8px_20px_rgba(242,106,27,0.28)] transition hover:translate-y-[-1px] hover:bg-[#dd5f15] disabled:opacity-60"
              >
                {loading ? "Kayıt oluşturuluyor..." : "Hesap oluştur"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#5f6f86]">
              Zaten hesabın var mı?{" "}
              <Link href={girisHref} className="font-bold text-[#0F2A4A] underline-offset-2 hover:text-[#F26A1B] hover:underline">
                Giriş yap
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center bg-[#f3f5f8]">
          <p className="text-sm font-semibold text-[#7A8CA5]">Yükleniyor...</p>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
