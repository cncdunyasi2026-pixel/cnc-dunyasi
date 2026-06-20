#!/usr/bin/env node
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY");
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

const db = getFirestore();
const COLLECTIONS = ["ads", "technical_service_listings", "spare_part_listings", "job_listings"];

async function migrateCollection(col) {
  let cursor = null;
  let updated = 0;
  while (true) {
    let q = db.collection(col).orderBy("__name__").limit(300);
    if (cursor) q = q.startAfter(cursor);
    const snap = await q.get();
    if (snap.empty) break;

    const batch = db.batch();
    for (const doc of snap.docs) {
      const data = doc.data();
      if (!data.ownerId && data.userId) {
        batch.update(doc.ref, {
          ownerId: data.userId,
          updatedAt: Timestamp.now(),
        });
        updated += 1;
      }
    }
    await batch.commit();
    cursor = snap.docs[snap.docs.length - 1];
  }
  return updated;
}

let total = 0;
for (const col of COLLECTIONS) {
  const n = await migrateCollection(col);
  total += n;
  console.log(`${col}: ${n} docs updated`);
}
console.log(`Done. Total updated: ${total}`);
