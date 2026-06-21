import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { PHASES } from "@/lib/phases";
import SubmitForm from "./SubmitForm";

export const metadata = { title: "Submit · Hackathon" };

export default async function SubmitPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/submit");

  const myEmail = user.email!.toLowerCase();

  const { data: phases } = await supabase
    .from("phase_progress")
    .select("phase,status")
    .eq("user_email", myEmail);

  const statusByPhase: Record<number, string> = {};
  (phases ?? []).forEach((p) => (statusByPhase[p.phase] = p.status));
  const allApproved = PHASES.every((p) => statusByPhase[p.n] === "approved");

  const { data: existing } = await supabase
    .from("submissions")
    .select("*")
    .eq("user_email", myEmail)
    .maybeSingle();

  if (!allApproved) {
    return (
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-accent2">submission</div>
        <h1 className="text-3xl font-bold mt-1">Locked.</h1>
        <p className="text-ink/80 mt-2 text-[15px]">
          Final submission opens once both phases are approved by an admin. Finish them first.
        </p>

        <ul className="mt-6 space-y-2">
          {PHASES.map((p) => {
            const s = statusByPhase[p.n];
            const tone =
              s === "approved"
                ? "border-green-500/40 text-green-300"
                : s === "pending"
                  ? "border-yellow-500/40 text-yellow-300"
                  : s === "rejected"
                    ? "border-red-500/40 text-red-300"
                    : "border-white/10 text-ink/75";
            return (
              <li key={p.n}>
                <Link
                  href={`/phase/${p.n}`}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 hover:bg-white/5 transition ${tone}`}
                >
                  <span className="text-xs font-mono">phase {p.n}</span>
                  <span className="text-sm flex-1">{p.title}</span>
                  <span className="text-xs">{s || "not started"}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">submission · unlocked</div>
      <h1 className="text-3xl font-bold mt-1">Submit your sim</h1>
      <p className="text-ink/80 mt-2 text-sm">
        Submitting as <span className="text-ink">{user.email}</span>. Edit anytime until the deadline.
      </p>

      <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
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
      </div>

      <SubmitForm initial={(existing as any) ?? null} userEmail={myEmail} />
    </div>
  );
}
