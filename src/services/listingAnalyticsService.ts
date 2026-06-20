"use client";

import { doc, increment, setDoc, updateDoc } from "firebase/firestore";
import { db, isFirebaseClientConfigured } from "@/lib/firebase";

/**
 * 24 saat boyunca aynı ilan aynı cihazdan tekrar sayılmaz.
 * localStorage → sekme/oturum kapansa bile devam eder (sessionStorage'dan fark).
 */
const DEBOUNCE_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD formatında bugünün tarihi (yerel saat dilimi). */
export function todayDateStr(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shouldTrack(listingId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = `lcl_${listingId}`;
    const raw = localStorage.getItem(key);
    const last = raw ? Number(raw) : 0;
    const now = Date.now();
    if (Number.isFinite(last) && now - last < DEBOUNCE_MS) return false;
    localStorage.setItem(key, String(now));
    return true;
  } catch {
    // Özel gezinme modunda localStorage devre dışı olabilir.
    return false;
  }
}

/**
 * Bir ilan tıklandığında çağrılır.
 *
 * - `ads/{id}.clickCount` artar (top-clicked için)
 * - `analytics_daily/{YYYY-MM-DD}.clicks` artar (grafikler için)
 *
 * Her iki yazma da aynı anda (Promise.all) gider, hata biri ötekini
 * engellemez.
 */
export async function trackAdClick(listingId: string): Promise<void> {
  if (!isFirebaseClientConfigured || !listingId) return;
  if (!shouldTrack(listingId)) return;

  const dayRef = doc(db, "analytics_daily", todayDateStr());

  await Promise.all([
    // İlanın toplam tıklanma sayısını güncelle
    updateDoc(doc(db, "ads", listingId), { clickCount: increment(1) }).catch(
      () => {
        // İlan silinmişse veya yetki yoksa sessizce geç
      },
    ),
    // Günlük toplama belgesini artır (belge yoksa merge:true ile oluşturur)
    setDoc(dayRef, { clicks: increment(1) }, { merge: true }),
  ]);
}
