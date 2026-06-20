import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ── Tipler ─────────────────────────────────────────────────── */

export type Conversation = {
  id: string;
  participantsKey: string;
  participants: string[];
  participantNames: Record<string, string>;
  listingId: string | null;
  listingTitle: string | null;
  listingUrl: string | null;
  listingImageUrl: string | null;
  lastMessage: string;
  lastMessageAt: number;
  lastMessageBy: string;
  unread: Record<string, number>;
  createdAt: number;
};

export type Message = {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: number;
  type: "text" | "listing";
};

/* ── Yardımcı ───────────────────────────────────────────────── */

function tsToMs(ts: unknown): number {
  if (!ts) return Date.now();
  if (typeof ts === "number") return ts;
  if (ts && typeof (ts as { toMillis?: () => number }).toMillis === "function") {
    return (ts as { toMillis: () => number }).toMillis();
  }
  return Date.now();
}

/* ── Sohbet bul veya oluştur ────────────────────────────────── */

export async function getOrCreateConversation(
  currentUser: { uid: string; displayName: string },
  otherUser: { uid: string; displayName: string },
  listing?: {
    id: string;
    title: string;
    url: string;
    imageUrl?: string;
  },
): Promise<{ conversationId: string; isNew: boolean }> {
  const sorted = [currentUser.uid, otherUser.uid].sort();
  const participantsKey = sorted.join("_");
  const listingId = listing?.id ?? null;

  /* Sorguya mutlaka "participants array-contains" ekle:
     böylece kural "uid() in resource.data.participants" ile uyumlu olur */
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", currentUser.uid),
    where("participantsKey", "==", participantsKey),
  );

  const snap = await getDocs(q);
  /* listingId'yi client tarafında filtrele */
  const existing = snap.docs.find(
    (d) => (d.data().listingId ?? null) === listingId,
  );
  if (existing) {
    return { conversationId: existing.id, isNew: false };
  }

  const convRef = await addDoc(collection(db, "conversations"), {
    participantsKey,
    participants: [currentUser.uid, otherUser.uid],
    participantNames: {
      [currentUser.uid]: currentUser.displayName,
      [otherUser.uid]: otherUser.displayName,
    },
    listingId,
    listingTitle: listing?.title ?? null,
    listingUrl: listing?.url ?? null,
    listingImageUrl: listing?.imageUrl ?? null,
    lastMessage: "",
    lastMessageAt: serverTimestamp(),
    lastMessageBy: currentUser.uid,
    unread: { [currentUser.uid]: 0, [otherUser.uid]: 0 },
    createdAt: serverTimestamp(),
  });

  return { conversationId: convRef.id, isNew: true };
}

/* ── Mesaj gönder ───────────────────────────────────────────── */

export async function sendMessage(
  conversationId: string,
  sender: { uid: string; displayName: string },
  text: string,
  type: "text" | "listing" = "text",
): Promise<void> {
  await addDoc(collection(db, "conversations", conversationId, "messages"), {
    text,
    senderId: sender.uid,
    senderName: sender.displayName,
    createdAt: serverTimestamp(),
    type,
  });

  const convDoc = await getDoc(doc(db, "conversations", conversationId));
  const convData = convDoc.data();
  if (!convData) return;

  const otherUid = (convData.participants as string[]).find(
    (uid) => uid !== sender.uid,
  );

  const patch: Record<string, unknown> = {
    lastMessage: type === "listing" ? "📎 İlan paylaşıldı" : text,
    lastMessageAt: serverTimestamp(),
    lastMessageBy: sender.uid,
  };
  if (otherUid) patch[`unread.${otherUid}`] = increment(1);

  await updateDoc(doc(db, "conversations", conversationId), patch);
}

/* ── Okundu işaretle ────────────────────────────────────────── */

export async function markAsRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  await updateDoc(doc(db, "conversations", conversationId), {
    [`unread.${userId}`]: 0,
  });
}

/* ── Sohbet listesini dinle ─────────────────────────────────── */

export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void,
): () => void {
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", userId),
    orderBy("lastMessageAt", "desc"),
  );

  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          participantsKey: data.participantsKey as string,
          participants: data.participants as string[],
          participantNames: data.participantNames as Record<string, string>,
          listingId: (data.listingId as string) ?? null,
          listingTitle: (data.listingTitle as string) ?? null,
          listingUrl: (data.listingUrl as string) ?? null,
          listingImageUrl: (data.listingImageUrl as string) ?? null,
          lastMessage: (data.lastMessage as string) ?? "",
          lastMessageAt: tsToMs(data.lastMessageAt),
          lastMessageBy: (data.lastMessageBy as string) ?? "",
          unread: (data.unread as Record<string, number>) ?? {},
          createdAt: tsToMs(data.createdAt),
        };
      }),
    );
  });
}

/* ── Mesajları dinle ────────────────────────────────────────── */

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void,
): () => void {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc"),
  );

  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          text: data.text as string,
          senderId: data.senderId as string,
          senderName: data.senderName as string,
          createdAt: tsToMs(data.createdAt),
          type: (data.type as "text" | "listing") ?? "text",
        };
      }),
    );
  });
}
