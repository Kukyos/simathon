import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
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

  // Admins skip onboarding entirely.
  if (isAdminEmail(user.email)) redirect(searchParams.next || "/setup");

  const { data: existing } = await supabase
    .from("profiles")
    .select("user_email")
    .eq("user_email", user.email!.toLowerCase())
    .maybeSingle();
  if (existing) redirect(searchParams.next || "/setup");

  return (
    <div className="max-w-lg mx-auto pt-6">
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">welcome</div>
      <h1 className="text-3xl font-bold mt-1">Quick intro.</h1>
      <p className="text-ink/80 mt-2 text-sm">
        Three questions. Helps us help you when something breaks.
      </p>
      <OnboardForm userEmail={user.email!.toLowerCase()} next={searchParams.next || "/setup"} />
    </div>
  );
}
