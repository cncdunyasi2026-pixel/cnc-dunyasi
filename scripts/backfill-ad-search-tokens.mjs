#!/usr/bin/env node
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { requireFirebaseAdminEnv } from "./loadFirebaseAdminEnv.mjs";

const { projectId, clientEmail, privateKey } = requireFirebaseAdminEnv();

if (getApps().length === 0) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

const db = getFirestore();
const MIN_PREFIX_LEN = 3;
const MAX_TOKENS = 400;

function normalizeForSearch(text) {
  return String(text ?? "")
    .trim()
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function adSearchBlob(data) {
  return [
    data.title,
    data.brand,
    data.model,
    data.city,
    data.district,
    data.neighborhood,
    data.description,
    data.category,
    data.condition,
    data.axisCount,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildAdSearchTokens(data) {
  const words = normalizeForSearch(adSearchBlob(data))
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 2);

  const tokens = new Set();
  for (const word of words) {
    tokens.add(word);
    for (let len = MIN_PREFIX_LEN; len < word.length; len += 1) {
      tokens.add(word.slice(0, len));
    }
  }

  return [...tokens].slice(0, MAX_TOKENS);
}

async function backfillAds() {
  let cursor = null;
  let updated = 0;
  let scanned = 0;

  console.log(`Project: ${projectId}`);

  while (true) {
    let q = db.collection("ads").orderBy("__name__").limit(200);
    if (cursor) q = q.startAfter(cursor);

    const snap = await q.get();
    if (snap.empty) break;

    const batch = db.batch();
    let batchCount = 0;

    for (const doc of snap.docs) {
      scanned += 1;
      const data = doc.data();
      const nextTokens = buildAdSearchTokens(data);
      const current = Array.isArray(data.searchTokens) ? data.searchTokens : [];

      if (JSON.stringify(current) === JSON.stringify(nextTokens)) {
        continue;
      }

      batch.update(doc.ref, { searchTokens: nextTokens });
      batchCount += 1;
      updated += 1;
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    cursor = snap.docs[snap.docs.length - 1];
    console.log(`Scanned ${scanned}, updated ${updated}`);
  }

  console.log(`Done. Scanned ${scanned}, updated ${updated}.`);
}

void backfillAds().catch((error) => {
  console.error(error);
  process.exit(1);
});
