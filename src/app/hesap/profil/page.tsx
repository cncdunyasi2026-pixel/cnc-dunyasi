"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useAccountBadges } from "@/hooks/useAccountBadges";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

/* ── İkon bileşenleri ───────────────────────────────────────── */

function IconListings() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconAd() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg className="h-4 w-4 text-[#7A8CA5] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

/* ── Menü kartı ─────────────────────────────────────────────── */

type MenuCardProps = {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  badge?: string | number;
};

function MenuCard({ href, icon, iconBg, title, description, badge }: MenuCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-[#dbe2ea] bg-white p-5 shadow-sm transition hover:border-[#0F2A4A]/30 hover:shadow-md"
    >
      <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
        {typeof badge === "number" && badge > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F26A1B] px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#0F2A4A]">{title}</span>
          {typeof badge === "string" && badge ? (
            <span className="rounded-full bg-[#F26A1B] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-[#7A8CA5]">{description}</p>
      </div>
      <IconArrow />
    </Link>
  );
}

/* ── Ana sayfa ──────────────────────────────────────────────── */

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const badges = useAccountBadges(user?.uid);

  const handleSignOut = async () => {
    try {
      await signOut(auth!);
      router.push("/");
    } catch {
      /* yoksay */
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl justify-center px-4 py-16">
        <p className="text-sm font-semibold text-[#7A8CA5]">Yükleniyor...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef2f8]">
          <svg className="h-8 w-8 text-[#0F2A4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-xl font-extrabold text-[#0F2A4A]">Hesabınıza giriş yapın</h1>
        <p className="mt-2 text-sm text-[#5f6f86]">İlanlarınızı, favorilerinizi ve bildirimlerinizi yönetmek için giriş yapın.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/hesap/giris"
            className="inline-flex justify-center rounded-xl bg-[#0F2A4A] px-6 py-3 text-sm font-bold !text-white visited:!text-white hover:!text-white shadow-[0_8px_20px_rgba(15,42,74,0.25)] transition hover:bg-[#12335c]"
          >
            Giriş yap
          </Link>
          <Link
            href="/hesap/kayit"
            className="inline-flex justify-center rounded-xl border border-[#dbe2ea] bg-white px-6 py-3 text-sm font-bold text-[#0F2A4A] transition hover:bg-[#f4f7fb]"
          >
            Kayıt ol
          </Link>
        </div>
      </section>
    );
  }

  /* Baş harfler avatar */
  const initials = (user.displayName ?? user.email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const memberSince = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">

      {/* ── Profil kartı ── */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-[#dbe2ea] bg-gradient-to-br from-[#0F2A4A] to-[#1e4a7a] shadow-[0_10px_30px_rgba(15,42,74,0.18)]">
        <div className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start sm:gap-6 sm:p-8">
          {/* Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black text-white backdrop-blur-sm ring-2 ring-white/20">
            {initials}
          </div>

          {/* Bilgiler */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-extrabold text-white">
              {user.displayName ?? "Kullanıcı"}
            </h1>
            <p className="mt-1 text-sm text-white/70">{user.email}</p>
            {memberSince && (
              <p className="mt-1 text-xs text-white/50">Üye: {memberSince}</p>
            )}
          </div>

          {/* CTA */}
          <Link
            href="/ilan-ver"
            className="shrink-0 rounded-xl bg-[#F26A1B] px-5 py-2.5 text-xs font-bold !text-white visited:!text-white hover:!text-white shadow-[0_6px_16px_rgba(242,106,27,0.35)] transition hover:bg-[#dd5f15]"
          >
            + İlan ver
          </Link>
        </div>
      </div>

      {/* ── Menü ── */}
      <div className="space-y-3">
        <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-[#7A8CA5]">HESABIM</p>

        <MenuCard
          href="/hesap/ilanlarim"
          icon={<IconListings />}
          iconBg="bg-[#eef2f8] text-[#0F2A4A]"
          title="İlanlarım"
          description="Tüm kategorilerdeki aktif, onay bekleyen ve arşiv ilanların"
          badge={badges.listingActions}
        />

        <MenuCard
          href="/hesap/favoriler"
          icon={<IconHeart />}
          iconBg="bg-red-50 text-red-500"
          title="Favorilerim"
          description="Beğendiğin ve takip ettiğin ilanlar"
        />

        <MenuCard
          href="/hesap/mesajlar"
          icon={<IconChat />}
          iconBg="bg-blue-50 text-blue-500"
          title="Mesajlaşmalar"
          description="İlan sahipleri ve alıcılarla yaptığın konuşmalar"
          badge={badges.unreadMessages}
        />

        <MenuCard
          href="/hesap/bildirimler"
          icon={<IconBell />}
          iconBg="bg-amber-50 text-amber-500"
          title="Bildirimlerim"
          description="Moderasyon sonuçları, mesajlar ve sistem bildirimleri"
          badge={badges.unreadNotifications}
        />

        <MenuCard
          href="/ilan-ver"
          icon={<IconAd />}
          iconBg="bg-[#fff4ee] text-[#F26A1B]"
          title="Yeni İlan Ver"
          description="İkinci el CNC, teknik servis, yedek parça veya iş ilanı oluştur"
        />

        <MenuCard
          href="/hesap/ayarlar"
          icon={<IconSettings />}
          iconBg="bg-[#f4f7fb] text-[#5f6f86]"
          title="Hesap Ayarları"
          description="Ad, e-posta, şifre ve bildirim tercihlerini düzenle"
        />
      </div>

      {/* ── Çıkış ── */}
      <div className="mt-8 border-t border-[#eef2f6] pt-6">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#dbe2ea] bg-white px-4 py-3 text-sm font-semibold text-[#5f6f86] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Çıkış yap
        </button>
      </div>
    </div>
  );
}
