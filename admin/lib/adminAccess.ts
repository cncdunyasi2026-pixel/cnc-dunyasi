const allowedEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

export function canAccessAdminByEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (allowedEmails.length === 0) return false;
  return allowedEmails.includes(email.toLowerCase());
}
