"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db, isFirebaseClientConfigured } from "@/lib/firebase";
import { addFavorite, favKey, removeFavorite } from "@/services/favoritesService";
import type { FavoriteKind } from "@/services/favoritesService";
import { useAuth } from "@/hooks/useAuth";

type UseFavoriteReturn = {
  isFavorited: boolean;
  loading: boolean;
  toggle: () => Promise<void>;
  requiresAuth: boolean;
};

export function useFavorite(
  kind: FavoriteKind,
  id: string,
  slug: string,
  title: string,
  image: string,
): UseFavoriteReturn {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isFirebaseClientConfigured || !id) {
      setLoading(false);
      setIsFavorited(false);
      return;
    }

    const key = favKey(kind, id);
    const ref = doc(db, "favorites", user.uid, "items", key);

    // Anlık Firestore dinleme — sekmeye döndüğünde de güncel kalır
    const unsub = onSnapshot(ref, (snap) => {
      setIsFavorited(snap.exists());
      setLoading(false);
    });

    return () => unsub();
  }, [user, kind, id]);

  const toggle = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    try {
      if (isFavorited) {
        await removeFavorite(user.uid, kind, id);
      } else {
        await addFavorite(user.uid, { kind, id, slug, title, image });
      }
    } finally {
      setLoading(false);
    }
  }, [user, isFavorited, kind, id, slug, title, image]);

  return {
    isFavorited,
    loading,
    toggle,
    requiresAuth: !user,
  };
}
