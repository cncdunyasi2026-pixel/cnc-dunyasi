"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, isFirebaseClientConfigured } from "@/lib/firebase";
import { syncAuthUserToFirestore } from "@/lib/firestore/users";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseClientConfigured) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        void syncAuthUserToFirestore(currentUser).catch((err) => {
          console.error("[Firebase] users/{uid} sync failed:", err);
        });
      }
    });

    return () => unsub();
  }, []);

  return { user, loading };
}
