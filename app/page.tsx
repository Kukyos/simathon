import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import ResumePill from "@/components/ResumePill";
import { PHASES } from "@/lib/phases";
import { isWorkshopOpen, workshopStartAtIso } from "@/lib/lock";
import { isAdmin as checkIsAdmin } from "@/lib/admin";

export default async function Home() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  let firstName: string | null = null;
  let phaseStatus: Record<number, string> = {};
  let hasSubmitted = false;
  let isAdmin = false;

  if (user) {
    const myEmail = user.email!.toLowerCase();
    const [{ data: profile }, { data: phases }, { data: sub }, admin] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("user_email", myEmail).maybeSingle(),
      supabase.from("phase_progress").select("phase,status").eq("user_email", myEmail),
      supabase.from("submissions").select("id").eq("user_email", myEmail).maybeSingle(),
      checkIsAdmin(supabase, user.email),
    ]);
    firstName = profile?.full_name ?? null;
    (phases ?? []).forEach((p) => (phaseStatus[p.phase] = p.status));
    hasSubmitted = !!sub;
    isAdmin = admin;
  }

  const open = isWorkshopOpen() || isAdmin;
  const startsAtIso = workshopStartAtIso();
  const startsAt = startsAtIso ? new Date(startsAtIso) : null;

  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-muted">simathon / docs</div>
      <h1 className="text-4xl font-bold mt-1 tracking-tight">
        {user ? (
          <>
            Hey, <span className="text-accent">{firstName?.split(" ")[0] ?? "you"}</span>.
          </>
        ) : (
          <>Welcome.</>
        )}
      </h1>
      <p className="text-ink/80 mt-2 max-w-xl text-[15px]">
        Your handbook for the workshop. Every step is on this site — read along, copy what you need,
        ask in chat if you get stuck.
      </p>

      <div className="mt-4">
        <ResumePill />
      </div>

      {!open && (
        <div className="mt-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-100/90">
          <div className="font-semibold text-yellow-200">Workshop hasn't started yet.</div>
          <div className="mt-1">
            Before we begin: install prerequisites (Setup) and submit Phase 1. Everything else unlocks when
            the meeting starts{startsAt ? ` — ${startsAt.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : ""}.
          </div>
        </div>
      )}

      {/* Logged-out CTA */}
      {!user && (
        <div className="mt-6 rounded-lg border border-white/10 bg-panel/40 p-4 text-sm flex items-center justify-between gap-3 flex-wrap">
          <div className="text-ink/85">
            You're not signed in. Sign in to unlock chat, the participant board, and submission.
          </div>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-md bg-accent text-black font-semibold text-sm shadow-[0_0_24px_-6px_rgba(255,106,61,0.6)]"
          >
            sign in
          </Link>
        </div>
      )}

      {/* Progress strip — only when logged in */}
      {user && (
        <section className="mt-8">
          <div className="text-xs uppercase tracking-[0.18em] text-muted mb-2">your progress</div>
          <div className="grid sm:grid-cols-3 gap-2">
            {PHASES.map((p) => {
              const s = phaseStatus[p.n];
              const tone =
                s === "approved"
                  ? "border-green-500/40 bg-green-500/5 text-green-200"
                  : s === "pending"
                    ? "border-yellow-500/40 bg-yellow-500/5 text-yellow-200"
                    : s === "rejected"
                      ? "border-red-500/40 bg-red-500/5 text-red-200"
                      : "border-white/10 bg-panel/40 text-ink/75";
              return (
                <Link
                  key={p.n}
                  href={`/phase/${p.n}`}
                  className={`group rounded-xl border px-3 py-3 hover:translate-y-[-2px] hover:border-accent/40 transition shadow-[0_0_0_0_rgba(0,0,0,0)] hover:shadow-[0_8px_28px_-12px_rgba(255,106,61,0.4)] ${tone}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-mono uppercase tracking-wider">
                      phase {p.n}
                    </div>
                    <div className="text-[10px]">{s ?? "not started"}</div>
                  </div>
                  <div className="text-sm font-semibold mt-1">{p.title}</div>
                </Link>
              );
            })}
            <Link
              href="/submit"
              className={`rounded-xl border px-3 py-3 hover:translate-y-[-2px] hover:border-accent/40 transition ${
                hasSubmitted
                  ? "border-accent/40 bg-accent/5 text-ink"
                  : "border-white/10 bg-panel/40 text-ink/75"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono uppercase tracking-wider">final</div>
                <div className="text-[10px]">{hasSubmitted ? "submitted" : "locked"}</div>
              </div>
              <div className="text-sm font-semibold mt-1">Hackathon submission</div>
            </Link>
          </div>
        </section>
      )}

      {/* Sections */}
      <section className="mt-10 grid sm:grid-cols-2 gap-3">
        {[
          { href: "/setup", n: "01", t: "Setup", d: "Three installs + a GitHub account. About 15 minutes. Do this first.", always: true },
          { href: "/blackhole", n: "02", t: "The demo", d: "What you'll see live — and the physics behind it. Download my black hole sim.", always: false },
          { href: "/workshop", n: "03", t: "Build", d: "How the workshop works. Pick a concept, paste the prompt, watch it come alive.", always: false },
          { href: "/hackathon", n: "04", t: "Hackathon", d: "Rules, theme, judging, prizes.", always: true },
          { href: "/participants", n: "05", t: "Participants", d: "Who else is here. Who's signed in. Who's submitted. Live.", always: false },
          { href: "/gallery", n: "06", t: "Gallery", d: "All the submissions. Click to view.", always: false },
          { href: "/chat", n: "07", t: "Chat", d: "Ask anything. Live during the workshop, async during the build week.", always: false },
        ].filter((c) => open || c.always).map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-xl border border-white/10 bg-panel/40 hover:bg-panel hover:border-accent/40 hover:translate-y-[-2px] hover:shadow-[0_8px_28px_-12px_rgba(124,92,255,0.4)] transition p-4 flex gap-4 items-start"
          >
            <div className="text-xs text-muted font-mono mt-0.5 group-hover:text-accent">{c.n}</div>
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
