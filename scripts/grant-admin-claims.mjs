import admin from "firebase-admin";

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Eksik env: ${name}`);
  }
  return value;
}

const projectId = required("FIREBASE_PROJECT_ID");
const clientEmail = required("FIREBASE_CLIENT_EMAIL");
const privateKey = required("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

const emailArg = process.argv[2] ?? "";
const emails = emailArg
  .split(",")
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

if (emails.length === 0) {
  throw new Error("Kullanim: node scripts/grant-admin-claims.mjs mail1@mail.com,mail2@mail.com");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const auth = admin.auth();

for (const email of emails) {
  try {
    const user = await auth.getUserByEmail(email);
    const existingClaims = user.customClaims ?? {};
    await auth.setCustomUserClaims(user.uid, {
      ...existingClaims,
      admin: true,
    });
    console.log(`admin=true verildi: ${email} (uid: ${user.uid})`);
  } catch (error) {
    console.error(`Basarisiz: ${email}`, error instanceof Error ? error.message : error);
  }
}
