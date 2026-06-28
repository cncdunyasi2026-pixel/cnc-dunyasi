"use client";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db, isFirebaseClientConfigured } from "@/lib/firebase";
import type { NeedsRevisionListing } from "@/lib/notifications/listingNotifications";

export type NotificationType = "moderation" | "message" | "system";

export type NotificationAction =
  | "listing_approved"
  | "listing_needs_revision"
  | "listing_rejected"
  | "new_message"
  | "system_announcement";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  action?: NotificationAction;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: number;
  listingId?: string;
  eventKey?: string;
};

export type CreateNotificationInput = {
  type: NotificationType;
  action?: NotificationAction;
  title: string;
  body: string;
  href: string;
  actorId?: string;
  eventKey?: string;
  listingId?: string;
  conversationId?: string;
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

function mapNotificationDoc(id: string, data: Record<string, unknown>): NotificationItem {
  return {
    id,
    type: (data.type as NotificationType) ?? "system",
    action: data.action as NotificationAction | undefined,
    title: String(data.title ?? "Bildirim"),
    body: String(data.body ?? ""),
    href: data.href ? String(data.href) : undefined,
    read: Boolean(data.read),
    createdAt: parseCreatedAt(data.createdAt),
    listingId: data.listingId ? String(data.listingId) : undefined,
    eventKey: data.eventKey ? String(data.eventKey) : undefined,
  };
}

export async function createNotificationForUser(
  userId: string,
  input: CreateNotificationInput,
): Promise<void> {
  if (!isFirebaseClientConfigured || !userId.trim()) return;

  await addDoc(collection(db, "notifications", userId, "items"), {
    type: input.type,
    ...(input.action ? { action: input.action } : {}),
    title: input.title,
    body: input.body,
    href: input.href,
    read: false,
    createdAt: serverTimestamp(),
    ...(input.actorId ? { actorId: input.actorId } : {}),
    ...(input.eventKey ? { eventKey: input.eventKey } : {}),
    ...(input.listingId ? { listingId: input.listingId } : {}),
    ...(input.conversationId ? { conversationId: input.conversationId } : {}),
  });
}

export async function fetchNotifications(userId: string): Promise<NotificationItem[]> {
  if (!isFirebaseClientConfigured) return [];

  const snap = await getDocs(
    query(collection(db, "notifications", userId, "items"), orderBy("createdAt", "desc")),
  );

  return snap.docs.map((d) => mapNotificationDoc(d.id, d.data() as Record<string, unknown>));
}

export function subscribeToNotifications(
  userId: string,
  callback: (items: NotificationItem[]) => void,
  onError?: (error: Error) => void,
): () => void {
  if (!isFirebaseClientConfigured) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, "notifications", userId, "items"),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => mapNotificationDoc(d.id, d.data() as Record<string, unknown>)));
    },
    (err) => {
      console.error("[notifications] Dinleme hatası:", err);
      onError?.(err);
      callback([]);
    },
  );
}

export function countUnreadNotifications(items: NotificationItem[]): number {
  return items.filter((item) => !item.read).length;
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

export function subscribeToNeedsRevisionCount(
  ownerId: string,
  callback: (count: number) => void,
): () => void {
  return subscribeToNeedsRevisionListings(ownerId, (listings) => {
    callback(listings.length);
  });
}

export function subscribeToNeedsRevisionListings(
  ownerId: string,
  callback: (listings: NeedsRevisionListing[]) => void,
): () => void {
  if (!isFirebaseClientConfigured) {
    callback([]);
    return () => {};
  }

  const collections = [
    "ads",
    "technical_service_listings",
    "spare_part_listings",
    "job_listings",
  ] as const;
  const listingsByKey: Record<string, NeedsRevisionListing> = {};
  const unsubs: Array<() => void> = [];

  const emit = () => {
    callback(Object.values(listingsByKey));
  };

  for (const col of collections) {
    const q = query(
      collection(db, col),
      where("ownerId", "==", ownerId),
      where("status", "==", "needs_revision"),
    );
    unsubs.push(
      onSnapshot(
        q,
        (snap) => {
          for (const key of Object.keys(listingsByKey)) {
            if (key.startsWith(`${col}:`)) delete listingsByKey[key];
          }
          for (const docSnap of snap.docs) {
            const data = docSnap.data() as Record<string, unknown>;
            const title = String(data.title ?? data.name ?? "İlanınız");
            const updatedAt = parseCreatedAt(data.updatedAt) || parseCreatedAt(data.createdAt);
            const sourceListingId =
              typeof data.sourceListingId === "string" ? data.sourceListingId : null;
            const hrefId = col === "ads" && sourceListingId ? sourceListingId : docSnap.id;
            listingsByKey[`${col}:${docSnap.id}`] = {
              collection: col,
              id: hrefId,
              title,
              updatedAt,
            };
          }
          emit();
        },
        (err) => {
          console.error(`[notifications] ${col} revizyon sorgusu hatası:`, err);
          for (const key of Object.keys(listingsByKey)) {
            if (key.startsWith(`${col}:`)) delete listingsByKey[key];
          }
          emit();
        },
      ),
    );
  }

  return () => {
    for (const unsub of unsubs) unsub();
  };
}
