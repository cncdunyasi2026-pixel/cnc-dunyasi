function readAllowedAdminEmails(): string[] {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

const DEFAULT_ADMIN_PATH_CODE = "25kj23lfd4073";

export function getAdminPathCode(): string {
  const fromEnv = (process.env.ADMIN_PATH_CODE ?? process.env.NEXT_PUBLIC_ADMIN_PATH_CODE ?? "").trim();
  return fromEnv || DEFAULT_ADMIN_PATH_CODE;
}

export function getAllowedAdminEmails(): string[] {
  return readAllowedAdminEmails();
}

export function canAccessAdminByEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = readAllowedAdminEmails();
  if (allowed.length === 0) return false;
  return allowed.includes(email.toLowerCase());
}

export function isValidAdminCode(code: string): boolean {
  return code === getAdminPathCode();
}
