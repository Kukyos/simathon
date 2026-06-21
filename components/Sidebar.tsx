import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { isAdmin as checkIsAdmin } from "@/lib/admin";
import SignOutButton from "./SignOutButton";

const SECTIONS: { label: string; links: { href: string; label: string; n?: string }[] }[] = [
  {
    label: "workshop",
    links: [
      { href: "/", label: "Home" },
      { href: "/setup", label: "Setup", n: "01" },
      { href: "/workshop", label: "Build", n: "02" },
      { href: "/hackathon", label: "Hackathon", n: "03" },
    ],
  },
  {
    label: "your progress",
    links: [
      { href: "/phase/1", label: "Phase 1 · Setup check" },
      { href: "/phase/2", label: "Phase 2 · First sim" },
      { href: "/submit", label: "Submit" },
    ],
  },
  {
    label: "community",
    links: [
      { href: "/chat", label: "Chat" },
      { href: "/participants", label: "Participants" },
      { href: "/gallery", label: "Gallery" },
    ],
  },
];

export default async function Sidebar() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user ? await checkIsAdmin(supabase, user.email) : false;

  return (
    <aside className="hidden md:flex w-[260px] shrink-0 border-r border-white/5 flex-col h-screen sticky top-0 bg-bg/70 backdrop-blur">
      <div className="px-5 pt-5 pb-3 flex items-center gap-2">
        <Link href="/" className="text-sm font-semibold tracking-tight text-ink hover:text-accent">
          simathon
        </Link>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted">handbook</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pt-2 pb-4 space-y-5">
        {SECTIONS.map((s) => (
          <div key={s.label}>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted px-2 mb-1.5">
              {s.label}
            </div>
            <ul className="space-y-0.5">
              {s.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-ink/80 hover:bg-white/5 hover:text-ink hover:translate-x-0.5 transition"
                  >
                    {l.n ? (
                      <span className="text-[10px] font-mono text-muted w-5 group-hover:text-accent">
                        {l.n}
                      </span>
                    ) : (
                      <span className="w-5" />
                    )}
                    <span>{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {isAdmin && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-violet-300 px-2 mb-1.5">
              admin
            </div>
            <ul className="space-y-0.5">
              <li>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-violet-200 hover:bg-violet-500/10 transition"
                >
                  <span className="w-5">⚙</span>
                  <span>Control room</span>
                </Link>
              </li>
            </ul>
          </div>
        )}
      </nav>

      <div className="border-t border-white/5 p-3">
        {user ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
            <span className="text-ink/85 truncate flex-1" title={user.email!}>
              {user.email}
            </span>
            <SignOutButton />
          </div>
        ) : (
          <Link
            href="/login"
            className="block text-center text-sm px-3 py-2 rounded-md bg-accent text-black font-semibold hover:opacity-90"
          >
            sign in
          </Link>
        )}
      </div>
    </aside>
  );
}
