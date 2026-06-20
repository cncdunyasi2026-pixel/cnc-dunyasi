import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] == null || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

/** Ops scriptleri icin .env.local / .env.production yukler. */
export function loadProjectEnv() {
  const root = resolve(import.meta.dirname, "..");
  loadEnvFile(resolve(root, ".env.local"));
  loadEnvFile(resolve(root, ".env.production"));
}

export function resolveFirebaseAdminEnv() {
  loadProjectEnv();

  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    "";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim() || "";
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY?.trim() || "";

  return {
    projectId,
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
  };
}

export function requireFirebaseAdminEnv() {
  const env = resolveFirebaseAdminEnv();

  if (!env.projectId || !env.clientEmail || !env.privateKey) {
    console.error(
      [
        "Firebase Admin env eksik.",
        "",
        ".env.local dosyaniza su alanlari ekleyin (ornek: .env.local.example):",
        "  FIREBASE_PROJECT_ID=cnc-dunyam",
        "  FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@cnc-dunyam.iam.gserviceaccount.com",
        "  FIREBASE_PRIVATE_KEY=\"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n\"",
        "",
        "Anahtar: Firebase Console > Project settings > Service accounts > Generate new private key",
      ].join("\n"),
    );
    process.exit(1);
  }

  return env;
}
