import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { isAdmin as checkIsAdmin } from "@/lib/admin";
import PollsRoom from "./PollsRoom";

export const metadata = { title: "Polls · Simathon" };

export default async function PollsPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/polls");

  const myEmail = user.email!.toLowerCase();
  const isAdmin = await checkIsAdmin(supabase, user.email);

  const [{ data: polls }, { data: votes }] = await Promise.all([
    supabase.from("polls").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("poll_votes").select("poll_id,user_email,choice"),
  ]);

  return (
    <div className="max-w-2xl">
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">live polls</div>
      <h1 className="text-3xl font-bold mt-1">Polls</h1>
      <p className="text-ink/80 mt-2 text-sm">
        Vote on whatever the host asks. Live tally. You can change your vote until the poll closes.
      </p>

      <PollsRoom
        userEmail={myEmail}
        isAdmin={isAdmin}
        initialPolls={polls ?? []}
        initialVotes={votes ?? []}
      />
    </div>
  );
}
