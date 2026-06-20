"use client";

import { useEffect } from "react";
import { isFirebaseClientConfigured } from "@/lib/firebase";
import { getApps } from "firebase/app";

/**
 * GA4 / Firebase Analytics sadece tarayıcıda, config geçerliyse ve measurementId tanımlıysa yüklenir.
 */
export default function FirebaseAnalytics() {
  useEffect(() => {
    if (!isFirebaseClientConfigured) return;

    const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
    if (!measurementId) return;

    const app = getApps()[0];
    if (!app) return;

    void import("firebase/analytics")
      .then(async ({ getAnalytics, isSupported }) => {
        if (!(await isSupported())) return;
        getAnalytics(app);
      })
      .catch(() => {});
  }, []);

  return null;
}
