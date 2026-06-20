"use client";

import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db, isFirebaseClientConfigured } from "@/lib/firebase";

export type NotificationType = "moderation" | "message" | "system";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: number;
};

function parseCreatedAt(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === "number") {
    return value;
  }
  return 0;
}

export async function fetchNotifications(userId: string): Promise<NotificationItem[]> {
  if (!isFirebaseClientConfigured) return [];

  const snap = await getDocs(
    query(collection(db, "notifications", userId, "items"), orderBy("createdAt", "desc")),
  );

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      type: (data.type as NotificationType) ?? "system",
      title: String(data.title ?? "Bildirim"),
      body: String(data.body ?? ""),
      href: data.href ? String(data.href) : undefined,
      read: Boolean(data.read),
      createdAt: parseCreatedAt(data.createdAt),
    };
  });
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  if (!isFirebaseClientConfigured) return;
  await updateDoc(doc(db, "notifications", userId, "items", notificationId), { read: true });
}

export async function markAllNotificationsRead(userId: string, ids: string[]): Promise<void> {
  if (!isFirebaseClientConfigured || ids.length === 0) return;

  const batch = writeBatch(db);
  for (const id of ids) {
    batch.update(doc(db, "notifications", userId, "items", id), { read: true });
  }
  await batch.commit();
}
