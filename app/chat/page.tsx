import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import ChatRoom from "./ChatRoom";

export const metadata = { title: "Chat · Workshop Q&A" };

export default async function ChatPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/chat");

  const [{ data: initial }, { data: dbAdmin }] = await Promise.all([
    supabase
      .from("messages")
      .select("id,user_email,display_name,content,is_admin,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.rpc("am_i_admin"),
  ]);
  const isAdmin = dbAdmin === true || isAdminEmail(user.email);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">live Q&A</div>
      <h1 className="text-3xl font-extrabold mt-1 mb-1">Chat</h1>
      <p className="text-sm text-muted mb-5">
        Stuck on setup, on the workshop, or building your sim? Ask here. <a href="https://www.linkedin.com/in/armaansucks/" target="_blank" rel="noreferrer" className="text-ink underline underline-offset-2 hover:text-accent">Armaan</a> + everyone else can answer.
        No question is too small.
      </p>
      <ChatRoom
        userEmail={user.email!.toLowerCase()}
        isAdmin={isAdmin}
        initialMessages={(initial ?? []).reverse()}
      />
    </div>
  );
}
