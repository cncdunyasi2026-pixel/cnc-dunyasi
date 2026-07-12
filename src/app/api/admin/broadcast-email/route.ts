import { NextResponse } from "next/server";
import { FieldValue, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { verifyAdminFromRequest } from "@/lib/admin/verifyAdminRequest.server";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";
import { buildBroadcastEmailHtml } from "@/lib/mail/broadcastEmailTemplate";
import {
  isMailConfigured,
  mailConfigHint,
  sendOutboundEmail,
} from "@/lib/mail/sendMail.server";
import { BRAND_NAME } from "@/lib/constants/brand";
import { SITE_URL } from "@/lib/seo/metadata";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = {
  subject?: string;
  message?: string;
  imageUrl?: string;
  toUsers?: boolean;
  toContacts?: boolean;
  extraEmails?: string[];
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizeImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function getProjectId(): string | null {
  return (
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    null
  );
}

function canUseAdminSdk(): boolean {
  const hasSa = Boolean(
    process.env.FIREBASE_CLIENT_EMAIL?.trim() && process.env.FIREBASE_PRIVATE_KEY?.trim(),
  );
  const cloud = Boolean(
    process.env.K_SERVICE || process.env.FUNCTION_TARGET || process.env.FIREBASE_CONFIG,
  );
  return isFirebaseAdminConfigured && Boolean(adminDb) && (hasSa || cloud);
}

function collectEmailsFromAdminDocs(docs: QueryDocumentSnapshot[]): string[] {
  const emails = new Set<string>();
  for (const docSnap of docs) {
    const data = docSnap.data() as Record<string, unknown>;
    const email = typeof data.email === "string" ? normalizeEmail(data.email) : "";
    if (isValidEmail(email)) emails.add(email);
  }
  return [...emails];
}

function parseFirestoreStringField(field: unknown): string | null {
  if (!field || typeof field !== "object") return null;
  const value = (field as { stringValue?: string }).stringValue;
  return typeof value === "string" ? value : null;
}

async function listEmailsViaRest(idToken: string, collectionName: string): Promise<string[]> {
  const projectId = getProjectId();
  if (!projectId) return [];

  const emails = new Set<string>();
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "300" });
    if (pageToken) params.set("pageToken", pageToken);

    const url =
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/` +
      `${collectionName}?${params.toString()}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`${collectionName} okunamadı (${response.status}): ${detail.slice(0, 180)}`);
    }

    const data = (await response.json()) as {
      documents?: Array<{ fields?: Record<string, unknown> }>;
      nextPageToken?: string;
    };

    for (const doc of data.documents ?? []) {
      const email = parseFirestoreStringField(doc.fields?.email);
      if (!email) continue;
      const normalized = normalizeEmail(email);
      if (isValidEmail(normalized)) emails.add(normalized);
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return [...emails];
}

export async function POST(request: Request) {
  const admin = await verifyAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Yetkisiz. Oturum doğrulanamadı veya admin değilsiniz. Sayfayı yenileyip tekrar deneyin.",
      },
      { status: 401 },
    );
  }

  if (!isMailConfigured()) {
    return NextResponse.json({ error: mailConfigHint() }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const subject = body.subject?.trim() ?? "";
  const message = body.message?.trim() ?? "";
  const imageUrl = sanitizeImageUrl(body.imageUrl);
  const toUsers = body.toUsers === true;
  const toContacts = body.toContacts === true;
  const extraEmails = Array.isArray(body.extraEmails)
    ? body.extraEmails.map(normalizeEmail).filter(isValidEmail)
    : [];

  if (!subject || !message) {
    return NextResponse.json({ error: "Konu ve mesaj zorunludur." }, { status: 400 });
  }
  if (subject.length > 150 || message.length > 5000) {
    return NextResponse.json({ error: "Konu veya mesaj çok uzun." }, { status: 400 });
  }
  if (!toUsers && !toContacts && extraEmails.length === 0) {
    return NextResponse.json(
      { error: "En az bir alıcı seçin veya elle e-posta yazın." },
      { status: 400 },
    );
  }

  const recipients = new Set<string>(extraEmails);

  try {
    if (toUsers || toContacts) {
      if (canUseAdminSdk() && adminDb) {
        if (toUsers) {
          const usersSnap = await adminDb.collection("users").get();
          for (const email of collectEmailsFromAdminDocs(usersSnap.docs)) {
            recipients.add(email);
          }
        }
        if (toContacts) {
          const contactsSnap = await adminDb.collection("mail_contacts").get();
          for (const email of collectEmailsFromAdminDocs(contactsSnap.docs)) {
            recipients.add(email);
          }
        }
      } else {
        if (toUsers) {
          for (const email of await listEmailsViaRest(admin.idToken, "users")) {
            recipients.add(email);
          }
        }
        if (toContacts) {
          for (const email of await listEmailsViaRest(admin.idToken, "mail_contacts")) {
            recipients.add(email);
          }
        }
      }
    }
  } catch (err) {
    console.error("[broadcast-email] Alıcı listesi alınamadı:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Alıcı listesi okunamadı. Firestore kurallarını deploy ettiğinizden emin olun.",
      },
      { status: 500 },
    );
  }

  const recipientList = [...recipients];
  if (recipientList.length === 0) {
    return NextResponse.json({ error: "Gönderilecek e-posta adresi bulunamadı." }, { status: 404 });
  }

  let sentCount = 0;
  const failures: string[] = [];

  const html = buildBroadcastEmailHtml({ subject, message, imageUrl });
  const textBody = `${subject}\n\n${message}${imageUrl ? `\n\nGörsel: ${imageUrl}` : ""}\n\n—\n${BRAND_NAME} · ${SITE_URL}`;

  for (const to of recipientList) {
    try {
      await sendOutboundEmail({
        to,
        subject,
        text: textBody,
        html,
      });
      sentCount += 1;
    } catch (err) {
      failures.push(to);
      console.error("[broadcast-email] Gönderim hatası:", to, err);
    }
  }

  try {
    if (canUseAdminSdk() && adminDb) {
      await adminDb.collection("audit_logs").add({
        action: "broadcast_email",
        detail: `"${subject}" → ${sentCount}/${recipientList.length} (users=${toUsers}, contacts=${toContacts}, extra=${extraEmails.length})`,
        actorId: admin.uid,
        createdAt: FieldValue.serverTimestamp(),
        failureCount: failures.length,
      });
    }
  } catch (err) {
    console.error("[broadcast-email] Audit yazılamadı:", err);
  }

  return NextResponse.json({
    ok: true,
    recipientCount: recipientList.length,
    sentCount,
    failureCount: failures.length,
  });
}
