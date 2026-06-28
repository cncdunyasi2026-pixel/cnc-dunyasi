"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationFeed } from "@/hooks/useNotificationFeed";
import { isVirtualNotificationId } from "@/lib/notifications/listingNotifications";
import { dismissNotificationIds } from "@/lib/notifications/notificationDismissal";
import {
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
  type NotificationType,
} from "@/services/notificationService";

const TYPE_LABELS: Record<NotificationType, string> = {
  moderation: "Moderasyon",
  message: "Mesaj",
  system: "Sistem",
};

const TYPE_STYLES: Record<NotificationType, string> = {
  moderation: "bg-amber-50 text-amber-700 border-amber-200",
  message: "bg-blue-50 text-blue-700 border-blue-200",
  system: "bg-[#eef2f8] text-[#0F2A4A] border-[#dbe2ea]",
};

function formatTime(ms: number): string {
  if (!ms) return "";
  const now = Date.now();
  const diff = now - ms;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  return new Date(ms).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BildirimlerPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, loading, error: feedError, refreshDismissed } = useNotificationFeed(user?.uid);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/hesap/giris?redirect=%2Fhesap%2Fbildirimler");
    }
  }, [user, authLoading, router]);

  const handleOpen = async (item: NotificationItem) => {
    if (!user || item.read) return;

    if (isVirtualNotificationId(item.id)) {
      dismissNotificationIds(user.uid, [item.id]);
      refreshDismissed();
      return;
    }

    try {
      await markNotificationRead(user.uid, item.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bildirim güncellenemedi.");
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;

    const unreadStored = items.filter((item) => !item.read && !isVirtualNotificationId(item.id));
    const unreadVirtual = items
      .filter((item) => !item.read && isVirtualNotificationId(item.id))
      .map((item) => item.id);

    if (unreadStored.length === 0 && unreadVirtual.length === 0) return;

    try {
      if (unreadStored.length > 0) {
        await markAllNotificationsRead(
          user.uid,
          unreadStored.map((item) => item.id),
        );
      }
      if (unreadVirtual.length > 0) {
        dismissNotificationIds(user.uid, unreadVirtual);
      }
      refreshDismissed();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bildirimler güncellenemedi.");
    }
  };

  const displayError = error ?? feedError;
  const unreadCount = items.filter((item) => !item.read).length;

  if (authLoading || (!user && loading)) {
    return (
      <div className="mx-auto flex max-w-4xl justify-center px-4 py-16">
        <p className="text-sm font-semibold text-[#7A8CA5]">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[#7A8CA5]">HESABIM</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#0F2A4A] md:text-3xl">Bildirimlerim</h1>
          <p className="mt-2 max-w-xl text-sm text-[#5f6f86]">
            Moderasyon sonuçları, mesajlar ve sistem bildirimleri burada görünür.
          </p>
        </div>

        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="inline-flex justify-center rounded-xl border border-[#dbe2ea] bg-white px-4 py-3 text-sm font-bold text-[#0F2A4A] transition hover:border-[#0F2A4A]"
          >
            Tümünü okundu işaretle
          </button>
        ) : null}
      </div>

      {displayError ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {displayError}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-[#e5eaf0]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[#dbe2ea] bg-[#f8fafc] px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
            <BellIcon />
          </div>
          <p className="text-base font-bold text-[#0F2A4A]">Henüz bildirim yok</p>
          <p className="mt-2 text-sm text-[#5f6f86]">
            İlan moderasyonu, yeni mesajlar ve sistem duyuruları burada listelenecek.
          </p>
          <Link
            href="/hesap/ilanlarim"
            className="mt-6 inline-flex rounded-xl bg-[#F26A1B] px-6 py-3 text-sm font-bold !text-white visited:!text-white hover:!text-white"
          >
            İlanlarımı görüntüle
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#dbe2ea] bg-white shadow-sm">
          {items.map((item, index) => {
            const content = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${TYPE_STYLES[item.type]}`}
                      >
                        {TYPE_LABELS[item.type]}
                      </span>
                      {!item.read ? (
                        <span className="inline-flex h-2 w-2 rounded-full bg-[#F26A1B]" aria-hidden />
                      ) : null}
                    </div>
                    <p className={`mt-2 text-sm ${item.read ? "font-semibold text-[#0F2A4A]" : "font-bold text-[#0F2A4A]"}`}>
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#5f6f86]">{item.body}</p>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-[#7A8CA5]">
                    {formatTime(item.createdAt)}
                  </span>
                </div>
              </>
            );

            const className = `block px-4 py-4 transition hover:bg-[#f8fafc] ${
              index > 0 ? "border-t border-[#eef2f6]" : ""
            } ${!item.read ? "bg-[#fdfeff]" : ""}`;

            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={className}
                  onClick={() => void handleOpen(item)}
                >
                  {content}
                </Link>
              );
            }

            return (
              <div key={item.id} className={className}>
                {content}
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-[#7A8CA5] md:text-left">
        <Link href="/hesap/profil" className="font-semibold hover:text-[#0F2A4A]">
          ← Profil&apos;e dön
        </Link>
      </p>
    </div>
  );
}

function BellIcon() {
  return (
    <svg className="h-7 w-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}
