import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { isAdmin as checkIsAdmin } from "@/lib/admin";
import { isWorkshopOpen, workshopStartAtIso } from "@/lib/lock";
import LockedScreen from "@/components/LockedScreen";
import ChatRoom from "./ChatRoom";

export const metadata = { title: "Chat · Workshop Q&A" };

export default async function ChatPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/chat");

  const preAdmin = await checkIsAdmin(supabase, user.email);
  if (!isWorkshopOpen() && !preAdmin) {
    return <LockedScreen startsAtIso={workshopStartAtIso()} title="Chat opens when the workshop starts." blurb="Stuck on setup before the workshop? DM me on LinkedIn — linkedin.com/in/armaansucks." />;
  }

  const myEmail = user.email!.toLowerCase();
  const [{ data: initial }, isAdmin, { data: profile }, { data: roster }] = await Promise.all([
    supabase
      .from("messages")
      .select("id,user_email,display_name,content,is_admin,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    checkIsAdmin(supabase, user.email),
    supabase.from("profiles").select("full_name").eq("user_email", myEmail).maybeSingle(),
    supabase.from("allowed_emails").select("full_name").eq("email", myEmail).maybeSingle(),
  ]);
  const displayName =
    profile?.full_name?.trim() ||
    roster?.full_name?.trim() ||
    myEmail.split("@")[0];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">live Q&A</div>
      <h1 className="text-3xl font-extrabold mt-1 mb-1">Chat</h1>
      <p className="text-sm text-muted mb-4">
        Stuck on setup, on the workshop, or building your sim? Ask here. <a href="https://www.linkedin.com/in/armaansucks/" target="_blank" rel="noreferrer" className="text-ink underline underline-offset-2 hover:text-accent">Armaan</a> + everyone else can answer.
        No question is too small.
      </p>

      <div className="mb-5 rounded-md border border-yellow-500/30 bg-yellow-500/5 px-3 py-2.5 text-xs text-yellow-100/90">
        <div className="font-semibold text-yellow-200 mb-0.5">Chat rules — read once, then forget:</div>
        <ul className="list-disc pl-4 space-y-0.5 text-yellow-100/80">
          <li>No profanity, slurs, or personal attacks. Your name is next to every message.</li>
          <li>No spam, no self-promo, no off-topic dumps.</li>
          <li>English please, so everyone can help you.</li>
          <li>Admins can delete anything and wipe the room. Don't test it.</li>
        </ul>
      </div>
      <ChatRoom
        userEmail={myEmail}
        displayName={displayName}
        isAdmin={isAdmin}
        initialMessages={(initial ?? []).reverse()}
      />
    </div>
  );
}
