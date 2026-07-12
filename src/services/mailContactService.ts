import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db, isFirebaseClientConfigured } from "@/lib/firebase";

export type MailContact = {
  id: string;
  email: string;
  label?: string;
  createdAt: number;
};

function parseCreatedAt(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === "number") return value;
  return 0;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Virgül, noktalı virgül veya satır sonu ile ayrılmış adresleri ayıklar. */
export function parseEmailList(raw: string): string[] {
  const parts = raw.split(/[\n,;]+/);
  const emails = new Set<string>();
  for (const part of parts) {
    const email = normalizeEmail(part);
    if (isValidEmail(email)) emails.add(email);
  }
  return [...emails];
}

export async function fetchMailContacts(): Promise<MailContact[]> {
  if (!isFirebaseClientConfigured) return [];
  const snap = await getDocs(query(collection(db, "mail_contacts"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      email: normalizeEmail(String(data.email ?? "")),
      label: typeof data.label === "string" && data.label.trim() ? data.label.trim() : undefined,
      createdAt: parseCreatedAt(data.createdAt),
    };
  });
}

export async function addMailContact(input: {
  email: string;
  label?: string;
  createdBy?: string;
}): Promise<MailContact> {
  if (!isFirebaseClientConfigured) {
    throw new Error("Firebase yapılandırılmamış.");
  }
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    throw new Error("Geçerli bir e-posta adresi girin.");
  }

  const existing = await fetchMailContacts();
  if (existing.some((item) => item.email === email)) {
    throw new Error("Bu e-posta zaten kayıtlı.");
  }

  const ref = await addDoc(collection(db, "mail_contacts"), {
    email,
    ...(input.label?.trim() ? { label: input.label.trim() } : {}),
    createdAt: serverTimestamp(),
    ...(input.createdBy ? { createdBy: input.createdBy } : {}),
  });

  return {
    id: ref.id,
    email,
    label: input.label?.trim() || undefined,
    createdAt: Date.now(),
  };
}

export async function deleteMailContact(id: string): Promise<void> {
  if (!isFirebaseClientConfigured) return;
  await deleteDoc(doc(db, "mail_contacts", id));
}
