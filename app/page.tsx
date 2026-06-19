import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import ResumePill from "@/components/ResumePill";

export default async function Home() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-muted">simathon / docs</div>
      <h1 className="text-3xl font-bold mt-1 tracking-tight">Welcome.</h1>
      <p className="text-ink/80 mt-2 max-w-xl text-[15px]">
        Your handbook for the workshop. Every step is on this site — read along, copy what you need,
        ask in chat if you get stuck.
      </p>

      <div className="mt-4">
        <ResumePill />
      </div>

      {!user && (
        <div className="mt-6 rounded-lg border border-white/10 bg-panel/40 p-4 text-sm flex items-center justify-between gap-3 flex-wrap">
          <div className="text-ink/85">
            You're not signed in. Sign in to unlock chat, the participant board, and submission.
          </div>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-md bg-accent text-black font-semibold text-sm"
          >
            sign in
          </Link>
        </div>
      )}

      <section className="mt-10 grid sm:grid-cols-2 gap-3">
        {[
          { href: "/setup", n: "01", t: "Setup", d: "Two installs. About 10 minutes. Do this first." },
          { href: "/workshop", n: "02", t: "Build", d: "How the workshop works. Pick a concept, paste the prompt, watch it come alive." },
          { href: "/hackathon", n: "03", t: "Hackathon", d: "Rules, theme, judging, prizes. (Most numbers [[TBD]].)" },
          { href: "/participants", n: "04", t: "Participants", d: "Who else is here, who's signed in, who's submitted. Live." },
          { href: "/gallery", n: "05", t: "Gallery", d: "All the submissions, click to view." },
          { href: "/submit", n: "06", t: "Submit", d: "Send in your sim when it's ready. Editable until the deadline." },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-xl border border-white/10 bg-panel/40 hover:bg-panel hover:border-accent/40 transition p-4 flex gap-4 items-start"
          >
            <div className="text-xs text-muted font-mono mt-0.5">{c.n}</div>
            <div className="min-w-0">
              <div className="text-ink font-semibold group-hover:text-accent">{c.t}</div>
              <div className="text-sm text-ink/70 mt-1 leading-relaxed">{c.d}</div>
            </div>
          </Link>
        ))}
      </section>

      <div className="mt-10 text-xs text-muted">Tip: bookmark this page. You'll be back.</div>
    </div>
  );
}
