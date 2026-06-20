import type { NextConfig } from "next";

/**
 * Turbopack bazi kosullarda `process.env.NEXT_PUBLIC_*`'i istemci paketinde bos birakiyor.
 * Env burada next.config okunurken (dotenv sonrasi) kopyalanir; tarayicide gercek Firebase config gorunur.
 */
const FIREBASE_PUBLIC_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
] as const;

function firebasePublicEnvForClient(): Record<string, string> {
  const o: Record<string, string> = {};
  for (const key of FIREBASE_PUBLIC_KEYS) {
    const v = process.env[key];
    if (v != null && v.trim() !== "") o[key] = v.trim();
  }
  return o;
}

const nextConfig: NextConfig = {
  env: firebasePublicEnvForClient(),
};

export default nextConfig;
