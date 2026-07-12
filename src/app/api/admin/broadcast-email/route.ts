import { NextResponse } from "next/server";
import { verifyAdminFromRequest } from "@/lib/admin/verifyAdminRequest.server";
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
  try {
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
    const failureReasons: string[] = [];

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
        const reason = err instanceof Error ? err.message : "Bilinmeyen hata";
        failureReasons.push(`${to}: ${reason}`);
        console.error("[broadcast-email] Gönderim hatası:", to, err);
      }
    }

    if (sentCount === 0) {
      return NextResponse.json(
        {
          error: failureReasons[0] || "E-posta gönderilemedi. SMTP ayarlarını kontrol edin.",
          recipientCount: recipientList.length,
          sentCount: 0,
          failureCount: failures.length,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      recipientCount: recipientList.length,
      sentCount,
      failureCount: failures.length,
    });
  } catch (err) {
    console.error("[broadcast-email] Beklenmeyen hata:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Beklenmeyen sunucu hatası.",
      },
      { status: 500 },
    );
  }
}
