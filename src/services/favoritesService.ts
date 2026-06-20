"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db, isFirebaseClientConfigured } from "@/lib/firebase";

export type FavoriteKind =
  | "ads"
  | "technical_service_listings"
  | "spare_part_listings"
  | "job_listings";

export type FavoriteItem = {
  /** favorites/{userId}/items/ altındaki belge ID'si */
  key: string;
  kind: FavoriteKind;
  id: string;
  slug: string;
  title: string;
  image: string;
  /** kind'a göre türetilmiş yol  */
  href: string;
  addedAt: number;
};

export function favKey(kind: FavoriteKind, id: string) {
  return `${kind}__${id}`;
}

export function hrefForFavorite(kind: FavoriteKind, slug: string, id: string): string {
  switch (kind) {
    case "ads":
      return `/ilan/${id}`;
    case "technical_service_listings":
      return `/kategori/teknik-servis/${slug}`;
    case "spare_part_listings":
      return `/kategori/yedek-parca/${slug}`;
    case "job_listings":
      return `/kariyer/${slug}`;
  }
}

export async function addFavorite(
  userId: string,
  payload: {
    kind: FavoriteKind;
    id: string;
    slug: string;
    title: string;
    image: string;
  },
): Promise<void> {
  if (!isFirebaseClientConfigured) return;
  const key = favKey(payload.kind, payload.id);
  await setDoc(doc(db, "favorites", userId, "items", key), {
    kind: payload.kind,
    id: payload.id,
    slug: payload.slug,
    title: payload.title,
    image: payload.image,
    addedAt: serverTimestamp(),
  });
}

export async function removeFavorite(userId: string, kind: FavoriteKind, id: string): Promise<void> {
  if (!isFirebaseClientConfigured) return;
  await deleteDoc(doc(db, "favorites", userId, "items", favKey(kind, id)));
}

export async function fetchFavorites(userId: string): Promise<FavoriteItem[]> {
  if (!isFirebaseClientConfigured) return [];
  const snap = await getDocs(
    query(collection(db, "favorites", userId, "items"), orderBy("addedAt", "desc")),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    const kind = data.kind as FavoriteKind;
    const id = String(data.id ?? "");
    const slug = String(data.slug ?? "");
    const addedAtRaw = data.addedAt;
    const addedAt =
      addedAtRaw && typeof addedAtRaw === "object" && "toMillis" in addedAtRaw
        ? (addedAtRaw as { toMillis: () => number }).toMillis()
        : typeof addedAtRaw === "number"
          ? addedAtRaw
          : 0;
    return {
      key: d.id,
      kind,
      id,
      slug,
      title: String(data.title ?? ""),
      image: String(data.image ?? "/banner_1.jpg"),
      href: hrefForFavorite(kind, slug, id),
      addedAt,
    };
  });
}
