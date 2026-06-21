import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { isAdmin as checkIsAdmin } from "@/lib/admin";
import OnboardForm from "./OnboardForm";

export const metadata = { title: "Welcome · Simathon" };

export default async function OnboardPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Hardcoded OR DB-flagged admin → skip onboarding entirely.
  if (await checkIsAdmin(supabase, user.email)) redirect(searchParams.next || "/setup");

  const { data: existing } = await supabase
    .from("profiles")
    .select("user_email")
    .eq("user_email", user.email!.toLowerCase())
    .maybeSingle();
  if (existing) redirect(searchParams.next || "/setup");

  // Full-screen takeover — sidebar + main + footer all covered.
  return (
    <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex items-center justify-center overflow-y-auto">
      <div className="w-full max-w-xl">
        <OnboardForm userEmail={user.email!.toLowerCase()} next={searchParams.next || "/setup"} />
      </div>
    </div>
  );
}
