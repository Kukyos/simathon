import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import SubmitForm from "./SubmitForm";

export const metadata = { title: "Submit · Hackathon" };

export default async function SubmitPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/submit");

  const myEmail = user.email!.toLowerCase();

  // ponytail: phase gate removed post-launch; submission is directly open.
  const { data: existing } = await supabase
    .from("submissions")
    .select("*")
    .eq("user_email", myEmail)
    .maybeSingle();

  const galleryStatus: "pending" | "approved" | "rejected" | null =
    (existing as any)?.gallery_status ?? null;
  const galleryNote: string | null = (existing as any)?.gallery_note ?? null;

  return (
    <div className="max-w-2xl">
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">submission · unlocked</div>
      <h1 className="text-3xl font-bold mt-1">Submit your sim</h1>
      <p className="text-ink/80 mt-2 text-sm">
        Submitting as <span className="text-ink">{user.email}</span>. Edit anytime until the deadline.
      </p>

      {galleryStatus === "pending" && (
        <div className="mt-4 rounded-md border border-yellow-500/40 bg-yellow-500/5 px-3 py-2 text-sm text-yellow-200">
          Submitted. Awaiting admin review — not in the public gallery yet.
        </div>
      )}
      {galleryStatus === "rejected" && (
        <div className="mt-4 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          <div className="font-semibold">Your submission was rejected by an admin.</div>
          {galleryNote && <div className="mt-1 text-red-100/85">Note: {galleryNote}</div>}
          <div className="mt-1 text-red-100/70">Edit below and resubmit; admin will re-review.</div>
        </div>
      )}
      {galleryStatus === "approved" && (
        <div className="mt-4 rounded-md border border-green-500/40 bg-green-500/5 px-3 py-2 text-sm text-green-200">
          Live in the gallery ✓
        </div>
      )}

      <div className="mt-6 grid sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg border border-white/10 bg-panel/40 p-3">
          <div className="text-[10px] uppercase tracking-wider text-accent2 mb-1">how to screenshot</div>
          <div className="text-ink/85">
            <span className="font-semibold">Windows:</span> <kbd className="kbd">Win</kbd> + <kbd className="kbd">Shift</kbd> + <kbd className="kbd">S</kbd>, drag a box.
            <br />
            <span className="font-semibold">Mac:</span> <kbd className="kbd">⌘</kbd> + <kbd className="kbd">Shift</kbd> + <kbd className="kbd">4</kbd>, drag a box.
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-panel/40 p-3">
          <div className="text-[10px] uppercase tracking-wider text-accent2 mb-1">how to screen-record</div>
          <div className="text-ink/85">
            <span className="font-semibold">Windows:</span> <kbd className="kbd">Win</kbd> + <kbd className="kbd">G</kbd>, hit the round record button.
            <br />
            <span className="font-semibold">Mac:</span> <kbd className="kbd">⌘</kbd> + <kbd className="kbd">Shift</kbd> + <kbd className="kbd">5</kbd>, choose "Record Selected Portion".
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-panel/40 p-3">
          <div className="text-[10px] uppercase tracking-wider text-accent2 mb-1">make your links public</div>
          <div className="text-ink/85">
            <span className="font-semibold">YouTube:</span> upload, set to <span className="font-mono">Unlisted</span>, copy share link.
            <br />
            <span className="font-semibold">Drive:</span> Share → <span className="font-mono">Anyone with the link</span>.
            <br />
            <span className="font-semibold">GitHub:</span> repo must be <span className="font-mono">Public</span>.
          </div>
        </div>
      </div>

      <SubmitForm initial={(existing as any) ?? null} userEmail={myEmail} />
    </div>
  );
}
