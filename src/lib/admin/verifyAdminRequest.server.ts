import "server-only";

export type VerifiedAdmin = {
  uid: string;
  email: string | null;
  idToken: string;
};

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function getWebApiKey(): string | null {
  return process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || null;
}

function getProjectId(): string | null {
  return (
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    null
  );
}

function hasExplicitServiceAccount(): boolean {
  return Boolean(
    process.env.FIREBASE_CLIENT_EMAIL?.trim() && process.env.FIREBASE_PRIVATE_KEY?.trim(),
  );
}

function isCloudRuntime(): boolean {
  return Boolean(process.env.K_SERVICE || process.env.FUNCTION_TARGET || process.env.FIREBASE_CONFIG);
}

type LookupAccount = {
  localId?: string;
  email?: string;
};

/** Public API key ile ID token doğrular (yerel Admin SDK olmadan da çalışır). */
async function lookupAccountByIdToken(idToken: string): Promise<LookupAccount | null> {
  const apiKey = getWebApiKey();
  if (!apiKey) return null;

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    },
  );

  if (!response.ok) return null;
  const data = (await response.json()) as { users?: LookupAccount[] };
  return data.users?.[0] ?? null;
}

async function firestoreGetDoc(
  idToken: string,
  collectionName: string,
  docId: string,
): Promise<Record<string, unknown> | null> {
  const projectId = getProjectId();
  if (!projectId) return null;

  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/` +
    `${collectionName}/${encodeURIComponent(docId)}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (response.status === 404) return null;
  if (!response.ok) return null;

  const data = (await response.json()) as {
    fields?: Record<string, unknown>;
  };
  return data.fields ?? {};
}

function readNestedBoolean(
  fields: Record<string, unknown> | null,
  parent: string,
  child: string,
): boolean {
  if (!fields) return false;
  const parentField = fields[parent] as
    | { mapValue?: { fields?: Record<string, { booleanValue?: boolean }> } }
    | undefined;
  return parentField?.mapValue?.fields?.[child]?.booleanValue === true;
}

async function isAdminViaUserToken(idToken: string, uid: string): Promise<boolean> {
  const [userFields, adminDoc] = await Promise.all([
    firestoreGetDoc(idToken, "users", uid),
    firestoreGetDoc(idToken, "admins", uid),
  ]);

  if (adminDoc) return true;
  return readNestedBoolean(userFields, "roles", "admin");
}

async function verifyViaAdminSdk(idToken: string): Promise<VerifiedAdmin | null> {
  // Dinamik import: Firebase Hosting/Turbopack'te statik firebase-admin/firestore
  // importu "Cannot find package firebase-admin-xxxxx" ile route'u düşürüyor.
  try {
    const { adminAuth, adminDb, isFirebaseAdminConfigured } = await import("@/lib/firebaseAdmin");
    if (!isFirebaseAdminConfigured || !adminAuth || !adminDb) return null;

    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    if (decoded.admin === true) {
      return { uid, email: decoded.email ?? null, idToken };
    }

    const [userSnap, adminSnap] = await Promise.all([
      adminDb.collection("users").doc(uid).get(),
      adminDb.collection("admins").doc(uid).get(),
    ]);

    const roleAdmin = userSnap.exists && userSnap.data()?.roles?.admin === true;
    if (roleAdmin || adminSnap.exists) {
      return { uid, email: decoded.email ?? null, idToken };
    }
  } catch (err) {
    console.error("[verifyAdmin] Admin SDK doğrulama hatası:", err);
  }
  return null;
}

export async function verifyAdminFromRequest(request: Request): Promise<VerifiedAdmin | null> {
  const idToken = getBearerToken(request);
  if (!idToken) return null;

  // 1) Mümkünse Admin SDK (dinamik)
  if (hasExplicitServiceAccount() || isCloudRuntime()) {
    const viaSdk = await verifyViaAdminSdk(idToken);
    if (viaSdk) return viaSdk;
  }

  // 2) Identity Toolkit + Firestore REST (yerel / SDK kırık olsa bile)
  try {
    const account = await lookupAccountByIdToken(idToken);
    const uid = account?.localId;
    if (!uid) return null;

    const ok = await isAdminViaUserToken(idToken, uid);
    if (!ok) return null;

    return {
      uid,
      email: account?.email ?? null,
      idToken,
    };
  } catch (err) {
    console.error("[verifyAdmin] Fallback doğrulama hatası:", err);
    return null;
  }
}
