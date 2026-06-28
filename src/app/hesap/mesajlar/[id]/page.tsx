"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  subscribeToMessages,
  sendMessage,
  markAsRead,
  type Message,
} from "@/services/messagingService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Conversation } from "@/services/messagingService";
import { listingUrlToPath } from "@/lib/utils/publicUrl";

/* ── Tarih ayırıcı ──────────────────────────────────────────── */

function dayLabel(ms: number): string {
  const d = new Date(ms);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Bugün";
  if (d.toDateString() === yesterday.toDateString()) return "Dün";
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function DaySeparator({ ms }: { ms: number }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-[#e8edf3]" />
      <span className="rounded-full bg-[#eef2f8] px-3 py-1 text-[11px] font-semibold text-[#8a9baf]">
        {dayLabel(ms)}
      </span>
      <div className="h-px flex-1 bg-[#e8edf3]" />
    </div>
  );
}

/* ── Mesaj baloncuğu ───────────────────────────────────────── */

function Bubble({
  msg,
  isMine,
  showAvatar,
  otherInitials,
}: {
  msg: Message;
  isMine: boolean;
  showAvatar: boolean;
  otherInitials: string;
}) {
  const time = new Date(msg.createdAt).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (msg.type === "listing") {
    return (
      <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar placeholder */}
        <div className="w-7 shrink-0" />

        <Link
          href={listingUrlToPath(msg.text)}
          className={`group flex max-w-[70%] items-center gap-3 overflow-hidden rounded-2xl border p-3 shadow-sm transition hover:shadow-md ${
            isMine
              ? "rounded-br-sm border-[#0a2240] bg-[#0F2A4A] text-white"
              : "rounded-bl-sm border-[#dbe2ea] bg-white text-[#0F2A4A]"
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isMine ? "bg-white/15" : "bg-[#eef2f8]"}`}>
            <svg className={`h-5 w-5 ${isMine ? "text-white" : "text-[#0F2A4A]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className={`text-[11px] font-semibold ${isMine ? "text-white/60" : "text-[#7A8CA5]"}`}>İlan Paylaşıldı</p>
            <p className={`mt-0.5 truncate text-xs font-bold underline underline-offset-2 ${isMine ? "text-white" : "text-[#0F2A4A]"}`}>
              İlanı görüntüle →
            </p>
            <p className={`mt-0.5 text-[10px] ${isMine ? "text-white/40" : "text-[#b0bcc9]"}`}>{time}</p>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar (karşı taraf için) */}
      {!isMine ? (
        showAvatar ? (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0F2A4A] text-[10px] font-black text-white">
            {otherInitials}
          </div>
        ) : (
          <div className="w-7 shrink-0" />
        )
      ) : (
        <div className="w-7 shrink-0" />
      )}

      {/* Balon */}
      <div className="max-w-[70%]">
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
            isMine
              ? "rounded-2xl rounded-br-sm bg-[#0F2A4A] text-white"
              : "rounded-2xl rounded-bl-sm bg-white text-[#0F2A4A] border border-[#e8edf3]"
          }`}
        >
          <p className="whitespace-pre-wrap">{msg.text}</p>
        </div>
        <p className={`mt-1 text-[10px] ${isMine ? "text-right text-[#b0bcc9]" : "text-left text-[#b0bcc9]"}`}>
          {time}
        </p>
      </div>
    </div>
  );
}

/* ── Ana sayfa ─────────────────────────────────────────────── */

export default function ChatPage() {
  const { id: conversationId } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [conv, setConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [convLoading, setConvLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialScrollDone = useRef(false);

  useEffect(() => {
    if (!authLoading && !user)
      router.replace(`/hesap/giris?redirect=/hesap/mesajlar/${conversationId}`);
  }, [user, authLoading, router, conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    void getDoc(doc(db, "conversations", conversationId)).then((snap) => {
      if (!snap.exists()) { router.replace("/hesap/mesajlar"); return; }
      const d = snap.data();
      setConv({
        id: snap.id,
        participantsKey: d.participantsKey as string,
        participants: d.participants as string[],
        participantNames: d.participantNames as Record<string, string>,
        listingId: (d.listingId as string) ?? null,
        listingTitle: (d.listingTitle as string) ?? null,
        listingUrl: (d.listingUrl as string) ?? null,
        listingImageUrl: (d.listingImageUrl as string) ?? null,
        lastMessage: "",
        lastMessageAt: 0,
        lastMessageBy: "",
        unread: (d.unread as Record<string, number>) ?? {},
        createdAt: 0,
      });
      setConvLoading(false);
    });
  }, [conversationId, router]);

  useEffect(() => {
    if (!conversationId) return;
    return subscribeToMessages(conversationId, setMessages);
  }, [conversationId]);

  useEffect(() => {
    if (!user || !conversationId) return;
    void markAsRead(conversationId, user.uid);
  }, [conversationId, user, messages.length]);

  useEffect(() => {
    if (messages.length === 0) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    if (!initialScrollDone.current) {
      /* İlk yükleme: layout tam oturuncaya kadar kısa bir bekleme */
      const timer = setTimeout(() => {
        container.scrollTop = container.scrollHeight;
        initialScrollDone.current = true;
      }, 50);
      return () => clearTimeout(timer);
    } else {
      /* Yeni mesaj: sadece alttaysak smooth kaydır */
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 120;
      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user || sending) return;
    setSending(true);
    setText("");
    try {
      await sendMessage(
        conversationId,
        { uid: user.uid, displayName: user.displayName ?? user.email ?? "Kullanıcı" },
        trimmed,
        "text",
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  if (authLoading || !user || convLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#eef2f8] border-t-[#0F2A4A]" />
          <p className="text-sm text-[#7A8CA5]">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const otherId = conv?.participants.find((p) => p !== user.uid) ?? "";
  const otherName = conv?.participantNames[otherId] ?? "Kullanıcı";
  const otherInitials = otherName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  /* Günlere göre grupla ve avatar gösterimini hesapla */
  type MsgWithDay = Message & { showDay: boolean; showAvatar: boolean };
  const enriched: MsgWithDay[] = messages.map((msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];

    const showDay =
      !prev ||
      new Date(prev.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

    /* Avatar: son mesaj veya sonraki farklı göndericiden */
    const showAvatar =
      msg.senderId !== user.uid &&
      (!next || next.senderId !== msg.senderId);

    return { ...msg, showDay, showAvatar };
  });

  return (
    <div
      className="mx-auto flex max-w-xl flex-col border-x border-[#eef2f6] bg-[#f6f8fb]"
      style={{ height: "calc(100dvh - 65px)" }}
    >
      {/* ── Header ── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-[#e8edf3] bg-white px-4 py-3 shadow-sm">
        <Link
          href="/hesap/mesajlar"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#5f6f86] transition hover:bg-[#f0f3f8]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0F2A4A] text-xs font-black text-white shadow-sm">
          {otherInitials}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-[#0F2A4A]">{otherName}</p>
          {conv?.listingTitle && (
            <Link
              href={listingUrlToPath(conv.listingUrl)}
              className="flex items-center gap-1 truncate"
            >
              <svg className="h-3 w-3 shrink-0 text-[#F26A1B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="truncate text-[11px] font-semibold text-[#F26A1B] hover:underline">
                {conv.listingTitle}
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Mesajlar ── */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
              <span className="text-3xl">👋</span>
            </div>
            <div>
              <p className="font-bold text-[#0F2A4A]">Sohbeti başlatın</p>
              <p className="mt-1 text-sm text-[#7A8CA5]">İlk mesajı gönderin.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {enriched.map((msg) => (
              <div key={msg.id}>
                {msg.showDay && <DaySeparator ms={msg.createdAt} />}
                <Bubble
                  msg={msg}
                  isMine={msg.senderId === user.uid}
                  showAvatar={msg.showAvatar}
                  otherInitials={otherInitials}
                />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <div className="shrink-0 border-t border-[#e8edf3] bg-white px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Mesaj yaz…"
            rows={1}
            className="max-h-28 min-h-[42px] flex-1 resize-none rounded-2xl border border-[#d8e0ea] bg-[#f4f7fb] px-4 py-2.5 text-sm text-[#0F2A4A] outline-none transition focus:border-[#0F2A4A] focus:bg-white focus:ring-2 focus:ring-[#0F2A4A]/10"
            style={{ overflowY: text.split("\n").length > 1 ? "auto" : "hidden" }}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!text.trim() || sending}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#F26A1B] text-white transition hover:bg-[#dd5f15] disabled:opacity-35 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5 translate-x-px" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-[#c8d3e2]">
          Ödeme ve hesap bilgilerini mesajla paylaşmayın
        </p>
      </div>
    </div>
  );
}
