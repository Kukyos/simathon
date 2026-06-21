// ponytail: hardcoded + env-var allowlist OR the DB is_admin flag on allowed_emails.
// We do NOT use the am_i_admin() RPC because auth.jwt() is unreliable in this setup —
// instead we pass user.email from the server session straight to a direct select.
import type { SupabaseClient } from "@supabase/supabase-js";

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

/** Hardcoded list OR `allowed_emails.is_admin = true` for the given email. */
export async function isAdmin(
  supabase: SupabaseClient,
  email: string | null | undefined,
): Promise<boolean> {
  if (!email) return false;
  if (isAdminEmail(email)) return true;
  const { data } = await supabase
    .from("allowed_emails")
    .select("is_admin")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return !!data?.is_admin;
}
