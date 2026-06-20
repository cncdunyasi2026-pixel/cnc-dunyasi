"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { db, isFirebaseClientConfigured } from "@/lib/firebase";

type AdminAccessState = {
  isAdmin: boolean;
  loading: boolean;
};

export function useAdminAccess(): AdminAccessState {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user || !isFirebaseClientConfigured) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      const [userSnap, adminSnap] = await Promise.all([
        getDoc(doc(db, "users", user.uid)),
        getDoc(doc(db, "admins", user.uid)),
      ]);

      const roleAdmin = userSnap.exists() && (userSnap.data()?.roles?.admin === true);
      const collectionAdmin = adminSnap.exists();

      if (!cancelled) {
        setIsAdmin(roleAdmin || collectionAdmin);
        setLoading(false);
      }
    };

    void load().catch(() => {
      if (!cancelled) {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  return { isAdmin, loading };
}
