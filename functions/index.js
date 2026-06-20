const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const bucket = admin.storage().bucket();

const LISTING_COLLECTIONS = [
  "ads",
  "technical_service_listings",
  "spare_part_listings",
  "job_listings",
];

async function deleteStoragePaths(paths) {
  if (!Array.isArray(paths) || paths.length === 0) return 0;
  let deleted = 0;
  for (const p of paths) {
    if (typeof p !== "string" || !p.trim()) continue;
    try {
      await bucket.file(p).delete({ ignoreNotFound: true });
      deleted += 1;
    } catch (err) {
      logger.warn("Storage delete failed", { path: p, err: String(err) });
    }
  }
  return deleted;
}

exports.cleanupDeletedListings = onSchedule(
  {
    schedule: "every day 03:10",
    region: "europe-west1",
    timeZone: "Europe/Istanbul",
    memory: "256MiB",
  },
  async () => {
    const threshold = admin.firestore.Timestamp.fromMillis(
      Date.now() - 180 * 24 * 60 * 60 * 1000,
    );

    let totalDeletedDocs = 0;
    let totalDeletedFiles = 0;

    for (const col of LISTING_COLLECTIONS) {
      const snap = await db
        .collection(col)
        .where("status", "==", "archived")
        .where("deletedAt", "<=", threshold)
        .limit(100)
        .get();

      if (snap.empty) continue;

      const batch = db.batch();
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        totalDeletedFiles += await deleteStoragePaths(data.imagePaths);
        batch.delete(docSnap.ref);
      }
      await batch.commit();
      totalDeletedDocs += snap.size;
    }

    logger.info("Archived listing cleanup completed", {
      totalDeletedDocs,
      totalDeletedFiles,
    });
  },
);

/**
 * Not:
 * onDocumentDeleted (Eventarc tabanli 2nd gen trigger) yeni projelerde
 * Eventarc Service Agent izin propagasyonu nedeniyle ilk saatlerde hata verebilir.
 * Bu nedenle cleanup'i guvenli sekilde scheduled job'a topluyoruz.
 */
