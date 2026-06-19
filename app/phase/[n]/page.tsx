import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { PHASES, phaseByNumber } from "@/lib/phases";
import PhaseForm from "./PhaseForm";

export const metadata = { title: "Phase · Simathon" };

export default async function PhasePage({ params }: { params: { n: string } }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/phase/${params.n}`);

  const n = parseInt(params.n, 10);
  const phase = phaseByNumber(n);
  if (!phase) notFound();

  const myEmail = user.email!.toLowerCase();
  const { data: row } = await supabase
    .from("phase_progress")
    .select("*")
    .eq("user_email", myEmail)
    .eq("phase", n)
    .maybeSingle();

  // Status of prior phase (for visualizing the track).
  const { data: priors } = await supabase
    .from("phase_progress")
    .select("phase,status")
    .eq("user_email", myEmail);
  const statusByPhase: Record<number, string> = {};
  (priors ?? []).forEach((p) => (statusByPhase[p.phase] = p.status));

  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">phase {n}</div>
      <h1 className="text-3xl font-bold mt-1">{phase.title}</h1>
      <p className="text-ink/80 mt-2 text-[15px]">{phase.blurb}</p>

      {/* Track */}
      <div className="mt-6 flex items-center gap-2">
        {PHASES.map((p, i) => {
          const s = statusByPhase[p.n];
          const dotClass =
            s === "approved"
              ? "bg-green-400 border-green-400"
              : s === "rejected"
                ? "bg-red-400/80 border-red-400/80"
                : s === "pending"
                  ? "bg-yellow-400/80 border-yellow-400/80 animate-pulse"
                  : "bg-white/5 border-white/20";
          return (
            <div key={p.n} className="flex items-center gap-2">
              <Link
                href={`/phase/${p.n}`}
                className={`relative w-6 h-6 rounded-full border-2 ${dotClass} flex items-center justify-center text-[10px] font-bold text-black hover:scale-110 transition`}
                title={p.title}
              >
                {s === "approved" ? "✓" : p.n}
              </Link>
              <span className={`text-xs ${p.n === n ? "text-ink" : "text-muted"}`}>{p.title}</span>
              {i < PHASES.length - 1 && <span className="w-6 h-px bg-white/10 mx-1" />}
            </div>
          );
        })}
      </div>

      {/* How to */}
      <section className="mt-8">
        <h2 className="text-sm uppercase tracking-[0.18em] text-muted mb-2">how to complete this</h2>
        <ol className="list-decimal pl-5 space-y-1.5 text-ink/85 text-[15px]">
          {phase.howTo.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </section>

      {/* Form */}
      <section className="mt-8">
        <h2 className="text-sm uppercase tracking-[0.18em] text-muted mb-2">your submission</h2>
        <PhaseForm
          phase={n}
          userEmail={myEmail}
          existing={
            row
              ? {
                  id: row.id,
                  status: row.status,
                  proof_url: row.proof_url,
                  caption: row.caption,
                }
              : null
          }
        />
      </section>
    </div>
  );
}
