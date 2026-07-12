import "server-only";
import { applicationDefault, cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function resolveProjectId(): string | undefined {
  const candidates = [
    process.env.FIREBASE_PROJECT_ID,
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    process.env.GCLOUD_PROJECT,
    process.env.GCP_PROJECT,
  ];
  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

function isCloudRuntime(): boolean {
  return Boolean(process.env.K_SERVICE || process.env.FUNCTION_TARGET || process.env.FIREBASE_CONFIG);
}

function createAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = resolveProjectId();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();

  if (isCloudRuntime() && projectId) {
    try {
      return initializeApp({
        credential: applicationDefault(),
        projectId,
      });
    } catch (error) {
      console.error("[firebaseAdmin] Application default credentials failed:", error);
    }
  }

  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
    } catch (error) {
      console.error("[firebaseAdmin] Service account cert failed:", error);
    }
  }

  // Yerelde ADC deneme: gcloud user creds ile app "hazır" görünür ama
  // Firestore/Auth Admin çağrıları timeout/401 üretir. Sadece Cloud Runtime.
  return null;
}

const adminApp = createAdminApp();

export const isFirebaseAdminConfigured = adminApp != null;
export const adminDb: Firestore | null = adminApp ? getFirestore(adminApp) : null;
export const adminAuth: Auth | null = adminApp ? getAuth(adminApp) : null;
