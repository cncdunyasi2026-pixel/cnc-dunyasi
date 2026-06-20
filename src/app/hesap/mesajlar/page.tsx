"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToConversations, type Conversation } from "@/services/messagingService";

/* ── Yardımcı ───────────────────────────────────────────────── */

function formatTime(ms: number): string {
  if (!ms) return "";
  const now = Date.now();
  const diff = now - ms;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün`;
  return new Date(ms).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

const AVATAR_COLORS = [
  "bg-[#0F2A4A]", "bg-[#1a5276]", "bg-[#6c3483]",
  "bg-[#1a5276]", "bg-[#145a32]", "bg-[#784212]",
];

function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

/* ── Sohbet kartı ───────────────────────────────────────────── */

function ConvCard({ conv, currentUserId }: { conv: Conversation; currentUserId: string }) {
  const otherId = conv.participants.find((p) => p !== currentUserId) ?? "";
  const otherName = conv.participantNames[otherId] ?? "Kullanıcı";
  const unread = conv.unread[currentUserId] ?? 0;
  const isFromMe = conv.lastMessageBy === currentUserId;

  const initials = otherName
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Link
      href={`/hesap/mesajlar/${conv.id}`}
      className={`flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#f4f7fb] ${
        unread > 0 ? "bg-[#fdfeff]" : "bg-white"
      }`}
    >
      {/* Avatar */}
      <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${avatarColor(otherName)}`}>
        {initials}
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#F26A1B] text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </div>

      {/* Metin */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1">
          <span className={`truncate text-[15px] ${unread > 0 ? "font-bold text-[#0F2A4A]" : "font-semibold text-[#0F2A4A]"}`}>
            {otherName}
          </span>
          <span className={`shrink-0 text-[11px] ${unread > 0 ? "font-bold text-[#F26A1B]" : "text-[#b0bcc9]"}`}>
            {formatTime(conv.lastMessageAt)}
          </span>
        </div>

        {conv.listingTitle && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-semibold text-[#F26A1B]">
            <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {conv.listingTitle}
          </p>
        )}

        <p className={`mt-0.5 truncate text-[13px] ${unread > 0 ? "font-semibold text-[#0F2A4A]" : "text-[#8a9baf]"}`}>
          {isFromMe && conv.lastMessage ? `Sen: ` : ""}
          {conv.lastMessage || "Henüz mesaj yok"}
        </p>
      </div>
    </Link>
  );
}

/* ── Skeleton ───────────────────────────────────────────────── */

function Skeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="h-12 w-12 animate-pulse rounded-full bg-[#eef2f8]" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 animate-pulse rounded-full bg-[#eef2f8]" />
        <div className="h-3 w-48 animate-pulse rounded-full bg-[#f4f7fb]" />
        <div className="h-3 w-40 animate-pulse rounded-full bg-[#f4f7fb]" />
      </div>
    </div>
  );
}

/* ── Ana sayfa ──────────────────────────────────────────────── */

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convLoading, setConvLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/hesap/giris?redirect=/hesap/mesajlar");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setConvLoading(true);
    return subscribeToConversations(user.uid, (convs) => {
      setConversations(convs);
      setConvLoading(false);
    });
  }, [user]);

  if (loading || !user) {
    return <div className="flex justify-center py-20"><p className="text-sm text-[#7A8CA5]">Yükleniyor...</p></div>;
  }

  return (
    <div className="mx-auto max-w-xl">
      {/* ── Başlık ── */}
      <div className="border-b border-[#eef2f6] bg-white px-4 py-5">
        <div className="mb-2 flex items-center gap-2">
          <h1 className="text-xl font-extrabold text-[#0F2A4A]">Mesajlar</h1>
          {conversations.length > 0 && (
            <span className="ml-auto rounded-full bg-[#eef2f8] px-2.5 py-0.5 text-xs font-bold text-[#5f6f86]">
              {conversations.length}
            </span>
          )}
        </div>
      </div>

      {/* ── Liste ── */}
      <div className="divide-y divide-[#f0f3f8] bg-white shadow-sm">
        {convLoading ? (
          <>{[1, 2, 3].map((i) => <Skeleton key={i} />)}</>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef2f8]">
              <svg className="h-8 w-8 text-[#7A8CA5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-[#0F2A4A]">Henüz mesaj yok</p>
              <p className="mt-1 text-sm text-[#7A8CA5]">
                Bir ilan sayfasından satıcıya mesaj göndererek başlayabilirsiniz.
              </p>
            </div>
            <Link
              href="/ilanlar"
              className="mt-2 inline-flex rounded-xl bg-[#0F2A4A] px-5 py-2.5 text-sm font-bold !text-white visited:!text-white hover:!text-white hover:bg-[#12335c]"
            >
              İlanlara göz at
            </Link>
          </div>
        ) : (
          conversations.map((conv) => (
            <ConvCard key={conv.id} conv={conv} currentUserId={user.uid} />
          ))
        )}
      </div>
    </div>
  );
}
