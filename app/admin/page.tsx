import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import AdminPanel from "./AdminPanel";

export const metadata = { title: "Admin · Simathon" };

export default async function AdminPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: isAdmin } = await supabase.rpc("am_i_admin");
  if (!isAdmin) {
    return (
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-accent2">admin</div>
        <h1 className="text-3xl font-bold mt-1">Not for you.</h1>
        <p className="text-ink/80 mt-2 text-sm">
          This page is admin-only. If you should have access, ask an existing admin to flag your email
          via the panel.
        </p>
      </div>
    );
  }

  const [{ data: participants }, { data: pending }] = await Promise.all([
    supabase.rpc("get_participants"),
    supabase
      .from("phase_progress")
      .select("id,user_email,phase,status,proof_url,caption,submitted_at")
      .eq("status", "pending")
      .order("submitted_at", { ascending: true }),
  ]);

  return (
    <AdminPanel
      participants={(participants as ParticipantRow[]) ?? []}
      pending={(pending as PendingRow[]) ?? []}
    />
  );
}

export type ParticipantRow = {
  email: string;
  full_name: string | null;
  platform: string | null;
  has_gpu: boolean | null;
  is_admin: boolean;
  last_sign_in_at: string | null;
  phase1_status: string | null;
  phase2_status: string | null;
  phases_complete: number;
  submission_id: string | null;
  submission_title: string | null;
};

export type PendingRow = {
  id: string;
  user_email: string;
  phase: number;
  status: string;
  proof_url: string | null;
  caption: string | null;
  submitted_at: string;
};
