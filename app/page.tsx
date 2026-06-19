import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import ResumePill from "@/components/ResumePill";

export default async function Home() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="pt-4">
      {/* Status strip */}
      <div className="flex items-center justify-between mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-muted">simathon · docs</div>
        {user ? (
          <span className="text-xs text-ink/80 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            signed in as <span className="text-ink">{user.email}</span>
          </span>
        ) : (
          <Link href="/login" className="text-xs text-accent hover:underline">
            sign in →
          </Link>
        )}
      </div>

      {/* Headline */}
      <h1 className="text-3xl font-bold tracking-tight">Welcome.</h1>
      <p className="text-ink/80 mt-2 max-w-xl text-[15px]">
        This is your handbook for the workshop. Every step you need is on this site. Read along,
        copy what you need, ask in chat if you get stuck.
      </p>

      {/* Resume */}
      <div className="mt-4">
        <ResumePill />
      </div>

      {/* Sections */}
      <section className="mt-10 grid sm:grid-cols-2 gap-3">
        {[
          {
            href: "/setup",
            n: "01",
            t: "Setup",
            d: "Install the two apps you need. About 10 minutes. Do this first.",
          },
          {
            href: "/workshop",
            n: "02",
            t: "Build",
            d: "How the workshop works. Pick a physics concept, paste a prompt, watch it come alive.",
          },
          {
            href: "/hackathon",
            n: "03",
            t: "Hackathon",
            d: "Rules, theme, judging, prizes. (Most numbers [[TBD]] until registration closes.)",
          },
          {
            href: "/submit",
            n: "04",
            t: "Submit",
            d: "Send in your simulation when it's ready. Editable until the deadline.",
          },
          {
            href: "/gallery",
            n: "05",
            t: "Gallery",
            d: "Everyone's builds, live as they come in. Steal ideas freely.",
          },
          {
            href: "/chat",
            n: "06",
            t: "Chat",
            d: "Ask anything. Live during the workshop, async during the build week.",
          },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-xl border border-white/10 bg-panel/40 hover:bg-panel hover:border-accent/40 transition p-4 flex gap-4 items-start"
          >
            <div className="text-xs text-muted font-mono mt-0.5">{c.n}</div>
            <div>
              <div className="text-ink font-semibold group-hover:text-accent">{c.t}</div>
              <div className="text-sm text-ink/70 mt-1 leading-relaxed">{c.d}</div>
            </div>
          </Link>
        ))}
      </section>

      <div className="mt-10 text-xs text-muted">
        Tip: bookmark this page. You'll be back.
      </div>
    </div>
  );
}
