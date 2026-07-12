import "server-only";

import nodemailer from "nodemailer";
import { BRAND_NAME } from "@/lib/constants/brand";
import { MAIL_FROM_ADDRESS } from "@/lib/constants/mail";
import { textToBrandedHtml } from "@/lib/mail/broadcastEmailTemplate";

export { buildBroadcastEmailHtml } from "@/lib/mail/broadcastEmailTemplate";

export const MAIL_FROM = `${BRAND_NAME} <${MAIL_FROM_ADDRESS}>`;

export type OutboundEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function hasSmtpConfig(): boolean {
  return Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

function hasResendConfig(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function isMailConfigured(): boolean {
  return hasSmtpConfig() || hasResendConfig();
}

export function mailConfigHint(): string {
  return (
    "E-posta için Hostinger SMTP ayarlarını tanımlayın: " +
    "SMTP_HOST=smtp.hostinger.com, SMTP_PORT=465, SMTP_SECURE=true, " +
    "SMTP_USER=info@cncdunyam.com, SMTP_PASS=..."
  );
}

async function sendViaResend(email: OutboundEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error("RESEND_API_KEY tanımlı değil.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [email.to],
      subject: email.subject,
      text: email.text,
      html: email.html ?? textToBrandedHtml(email.text, email.subject),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend hatası (${response.status}): ${detail.slice(0, 200)}`);
  }
}

async function sendViaSmtp(email: OutboundEmail): Promise<void> {
  const host = process.env.SMTP_HOST?.trim() || "smtp.hostinger.com";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) {
    throw new Error("SMTP ayarları eksik.");
  }

  const port = Number(process.env.SMTP_PORT?.trim() || "465");
  const secure =
    process.env.SMTP_SECURE === "true" ||
    (process.env.SMTP_SECURE !== "false" && port === 465);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM?.trim() || MAIL_FROM,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html ?? textToBrandedHtml(email.text, email.subject),
  });
}

/** @deprecated textToBrandedHtml kullanın */
export function textToHtml(text: string): string {
  return textToBrandedHtml(text);
}

export async function sendOutboundEmail(email: OutboundEmail): Promise<void> {
  if (hasResendConfig()) {
    await sendViaResend(email);
    return;
  }
  if (hasSmtpConfig()) {
    await sendViaSmtp(email);
    return;
  }
  throw new Error(mailConfigHint());
}
