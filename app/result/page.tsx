import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Your result · Simathon" };
export const dynamic = "force-dynamic";

const BANDS = [
  { key: "accuracy", label: "Scientific accuracy", max: 40 },
  { key: "design", label: "Design & visuals", max: 25 },
  { key: "creativity", label: "Creativity", max: 35 },
] as const;

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

  return (
    <div className="max-w-2xl">
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">your result · private</div>
      <h1 className="text-3xl font-bold mt-1">{r.title}</h1>
      {winnerLabel && <div className="mt-2 text-accent font-semibold">{winnerLabel}</div>}
      <p className="text-muted mt-2 text-sm">
        Only you can see this page. Scores are out of 100 across three bands.
      </p>

      <div className="mt-8 rounded-xl border border-white/10 bg-panel p-6">
        {BANDS.map((b) => (
          <div key={b.key} className="mb-5 last:mb-0">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-ink/90">{b.label}</span>
              <span className="font-mono text-ink">
                {r[b.key]}<span className="text-muted">/{b.max}</span>
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/5">
              <div
                className="h-2 rounded-full bg-accent"
                style={{ width: `${(r[b.key] / b.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
        <div className="mt-6 flex items-baseline justify-between border-t border-white/10 pt-4">
          <span className="text-sm uppercase tracking-[0.15em] text-muted">total</span>
          <span className="font-mono text-2xl text-accent">{total}<span className="text-sm text-muted">/100</span></span>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-accent/30 bg-accent/5 p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-accent">a note from armaan</div>
        <div className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink/95">
          {r.message}
        </div>
      </div>

      <p className="mt-8 text-sm text-muted">
        Your sim is also up on the public archive —{" "}
        <a
          href={`https://sim-gallery.vercel.app/p/${r.slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          see it in the Deep Field ↗
        </a>
      </p>
    </div>
  );
}
