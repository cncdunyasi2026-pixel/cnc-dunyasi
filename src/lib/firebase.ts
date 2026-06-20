"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * Bos stringleri undefined say.
 * NEXT_PUBLIC_* burada tek tek okunur; `process.env[degisken]` kullanma —
 * Next.js istemci bundle'inda dinamik erisim env'leri inline etmez (design-mode'a duser).
 */
function trimEnv(v: string | undefined): string | undefined {
  if (v == null) return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}

const NEXT_PUBLIC_FIREBASE_API_KEY = trimEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
const NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = trimEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
const NEXT_PUBLIC_FIREBASE_PROJECT_ID = trimEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
const NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = trimEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
const NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = trimEnv(
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
);
const NEXT_PUBLIC_FIREBASE_APP_ID = trimEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID);
const NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = trimEnv(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID);

export const isFirebaseClientConfigured =
  Boolean(NEXT_PUBLIC_FIREBASE_API_KEY) &&
  Boolean(NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) &&
  Boolean(NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
  Boolean(NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) &&
  Boolean(NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) &&
  Boolean(NEXT_PUBLIC_FIREBASE_APP_ID);

const firebaseConfig = {
  apiKey: NEXT_PUBLIC_FIREBASE_API_KEY ?? "design-mode-api-key",
  authDomain: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "design-mode.firebaseapp.com",
  projectId: NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "design-mode-project",
  storageBucket: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "design-mode.appspot.com",
  messagingSenderId: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "000000000000",
  appId: NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:000000000000:web:designmode",
  ...(NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    ? { measurementId: NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID }
    : {}),
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  if (isFirebaseClientConfigured) {
    console.info("[Firebase] Istemci hazir · proje:", firebaseConfig.projectId);
  } else {
    console.warn(
      "[Firebase] Tasarim modu: .env.local icinde NEXT_PUBLIC_FIREBASE_* alanlarini doldurun.",
    );
  }
}
