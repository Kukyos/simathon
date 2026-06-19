import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import SubmitForm from "./SubmitForm";

export const metadata = { title: "Submit · Hackathon" };

export default async function SubmitPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/submit");

  const { data: existing } = await supabase
    .from("submissions")
    .select("*")
    .eq("user_email", user.email!.toLowerCase())
    .maybeSingle();

  return (
    <div className="prose-body max-w-2xl mx-auto">
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">submission</div>
      <h1 className="text-4xl font-extrabold mt-1">Submit your sim</h1>
      <p className="text-ink/85 mt-2 text-sm">
        Submitting as <span className="text-ink">{user.email}</span>. You can edit this anytime until the deadline.
      </p>
      <SubmitForm initial={existing ?? null} userEmail={user.email!.toLowerCase()} />
    </div>
  );
}
