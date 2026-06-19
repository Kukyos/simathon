// ponytail: hardcoded + env-var allowlist. DB flag still required for admin RPCs.
// Set NEXT_PUBLIC_ADMIN_EMAILS in Vercel (comma-separated) when you add more admins.
const HARDCODED_ADMINS = ["amohamedarmaan@gmail.com"];

export function getAdminEmails(): string[] {
  const env = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  const fromEnv = env
    ? env.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];
  return Array.from(new Set([...HARDCODED_ADMINS, ...fromEnv].map((e) => e.toLowerCase())));
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
