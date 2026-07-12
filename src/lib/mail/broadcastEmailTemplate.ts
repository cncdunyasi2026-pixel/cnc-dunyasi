import { BRAND_DOMAIN, BRAND_NAME } from "@/lib/constants/brand";
import { MAIL_FROM_ADDRESS } from "@/lib/constants/mail";

const SITE_URL = `https://${BRAND_DOMAIN}`;

const COLORS = {
  navy: "#0B1F36",
  navyMid: "#12304F",
  accent: "#1B6CA8",
  accentSoft: "#E8F2FA",
  ink: "#142433",
  muted: "#5B6B7C",
  line: "#D8E0E8",
  bg: "#E9EEF3",
  white: "#FFFFFF",
} as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Düz metni paragraflara böler; boş satırlar bölüm ayırıcıdır. */
function formatMessageBody(text: string): string {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) return "";

  return blocks
    .map((block) => {
      const lines = escapeHtml(block).replace(/\n/g, "<br />");
      return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${COLORS.ink};">${lines}</p>`;
    })
    .join("");
}

export type BroadcastEmailTemplateInput = {
  subject: string;
  message: string;
  /** Genel erişilebilir https görsel URL (Firebase Storage vb.) */
  imageUrl?: string | null;
  imageAlt?: string | null;
};

function sanitizeImageUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.toString().replace(/"/g, "%22");
  } catch {
    return null;
  }
}

function renderHeroImage(imageUrl: string, imageAlt: string): string {
  const alt = escapeHtml(imageAlt || "Duyuru görseli");
  return `
                <tr>
                  <td style="padding:20px 0 4px;">
                    <img src="${imageUrl}" alt="${alt}" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:0;outline:none;border-radius:10px;" />
                  </td>
                </tr>`;
}

/**
 * CNC Dünyam toplu e-posta HTML şablonu.
 * Tablo + inline stil: Gmail / Outlook / Apple Mail uyumlu.
 */
export function buildBroadcastEmailHtml(input: BroadcastEmailTemplateInput): string {
  const subject = escapeHtml(input.subject.trim());
  const bodyHtml = formatMessageBody(input.message);
  const imageUrl = sanitizeImageUrl(input.imageUrl);
  const imageBlock = imageUrl
    ? renderHeroImage(imageUrl, input.imageAlt?.trim() || input.subject.trim())
    : "";
  const year = new Date().getFullYear();
  const logoUrl = `${SITE_URL}/logo-white.png`;
  const siteUrl = SITE_URL;
  const listingsUrl = `${SITE_URL}/ilanlar`;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
    ${subject} — ${BRAND_NAME}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Üst marka şeridi -->
          <tr>
            <td style="background:${COLORS.navy};border-radius:14px 14px 0 0;padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:22px 28px 18px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:12px;">
                          <img src="${logoUrl}" alt="${BRAND_NAME}" width="36" height="36" style="display:block;border:0;outline:none;width:36px;height:36px;" />
                        </td>
                        <td style="vertical-align:middle;">
                          <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.2;color:${COLORS.white};letter-spacing:0.02em;">
                            ${BRAND_NAME}
                          </div>
                          <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.3;color:#9BB0C4;letter-spacing:0.08em;text-transform:uppercase;padding-top:3px;">
                            CNC ilan &amp; servis platformu
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="height:3px;line-height:3px;font-size:0;background:${COLORS.accent};">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- İçerik -->
          <tr>
            <td style="background:${COLORS.white};padding:32px 28px 28px;border-left:1px solid ${COLORS.line};border-right:1px solid ${COLORS.line};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:8px;">
                    <span style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.accent};background:${COLORS.accentSoft};padding:5px 10px;border-radius:4px;">
                      Duyuru
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.35;color:${COLORS.navy};padding:4px 0 18px;">
                    ${subject}
                  </td>
                </tr>
                <tr>
                  <td style="height:1px;line-height:1px;font-size:0;background:${COLORS.line};">&nbsp;</td>
                </tr>
                ${imageBlock}
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;padding-top:20px;">
                    ${bodyHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:8px;padding-bottom:4px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" bgcolor="${COLORS.accent}" style="border-radius:8px;background:${COLORS.accent};">
                          <a href="${listingsUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:${COLORS.white};text-decoration:none;padding:13px 22px;border-radius:8px;">
                            İlanlara göz at →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:${COLORS.muted};padding-top:18px;">
                    veya siteyi ziyaret edin:
                    <a href="${siteUrl}" style="color:${COLORS.accent};text-decoration:none;font-weight:600;">${BRAND_DOMAIN}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Alt bilgi -->
          <tr>
            <td style="background:${COLORS.navyMid};border-radius:0 0 14px 14px;padding:22px 28px;border-left:1px solid ${COLORS.navyMid};border-right:1px solid ${COLORS.navyMid};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#A8B9CA;">
                    <strong style="color:${COLORS.white};">${BRAND_NAME}</strong><br />
                    İkinci el CNC, teknik servis, yedek parça ve kariyer<br />
                    <a href="mailto:${MAIL_FROM_ADDRESS}" style="color:#C5D6E6;text-decoration:none;">${MAIL_FROM_ADDRESS}</a>
                    &nbsp;·&nbsp;
                    <a href="${siteUrl}" style="color:#C5D6E6;text-decoration:none;">${BRAND_DOMAIN}</a>
                  </td>
                </tr>
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#7E93A8;padding-top:14px;border-top:1px solid #1E3A56;margin-top:14px;">
                    © ${year} ${BRAND_NAME}. Bu e-posta ${BRAND_DOMAIN} üzerinden gönderilmiştir.
                    Yanıtlamak için doğrudan bu adrese yazabilirsiniz.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Konu yoksa sade gövde şablonu (genel mail yardımcıları için). */
export function textToBrandedHtml(text: string, subject = "Mesaj"): string {
  return buildBroadcastEmailHtml({ subject, message: text });
}
