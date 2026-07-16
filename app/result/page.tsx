import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Your result · Simathon" };
export const dynamic = "force-dynamic";

export default async function ResultPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/result");

  // RLS only returns the signed-in participant's own row.
  const { data: r } = await supabase.from("personal_results").select("*").maybeSingle();

  if (!r) {
    return (
      <div className="max-w-2xl">
        <div className="text-xs uppercase tracking-[0.2em] text-accent2">your result</div>
        <h1 className="text-3xl font-bold mt-1">Nothing here yet</h1>
        <p className="text-ink/80 mt-3 text-sm">
          No scored submission is linked to <span className="text-ink">{user.email}</span>. If you
          submitted under a different email, sign in with that one. If you think this is a mistake,
          ping Armaan on the group chat.
        </p>
      </div>
    );
  }

  const total = (r.accuracy ?? 0) + (r.design ?? 0) + (r.creativity ?? 0);
  const winnerLabel =
    r.winner === "1" ? "🥇 First place" : r.winner === "2" ? "🥈 Second place" : r.winner === "3" ? "🥉 Third place" : null;

  const bands = [
    {
      label: "Scientific accuracy",
      score: r.accuracy,
      max: 40,
      reason: (
        <>
          Scored by the AI judge that read your code line by line. Its full review is on{" "}
          <a
            href={`https://sim-gallery.vercel.app/p/${r.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            your gallery page ↗
          </a>
        </>
      ),
    },
    { label: "Design & visuals", score: r.design, max: 25, reason: r.design_reason },
    { label: "Creativity", score: r.creativity, max: 35, reason: r.creativity_reason },
  ];

  return (
    <div className="max-w-2xl">
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">your result · private</div>
      <h1 className="text-3xl font-bold mt-1">{r.title}</h1>
      {winnerLabel && <div className="mt-2 text-accent font-semibold">{winnerLabel}</div>}
      <p className="text-muted mt-2 text-sm">Only you can see this page.</p>

      <div className="mt-8 space-y-4">
        {bands.map((b) => (
          <div key={b.label} className="rounded-xl border border-white/10 bg-panel p-5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-ink/90">{b.label}</span>
              <span className="font-mono text-lg text-ink">
                {b.score}
                <span className="text-muted text-sm">/{b.max}</span>
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/5">
              <div
                className="h-2 rounded-full bg-accent"
                style={{ width: `${(b.score / b.max) * 100}%` }}
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink/75">{b.reason}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-baseline justify-between rounded-xl border border-accent/30 bg-accent/5 px-5 py-4">
        <span className="text-sm uppercase tracking-[0.15em] text-muted">total</span>
        <span className="font-mono text-2xl text-accent">
          {total}
          <span className="text-sm text-muted">/100</span>
        </span>
      </div>
    </div>
  );
}
