import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/setup", label: "Setup" },
  { href: "/workshop", label: "Build" },
  { href: "/hackathon", label: "Hackathon" },
  { href: "/chat", label: "Chat" },
  { href: "/participants", label: "People" },
  { href: "/gallery", label: "Gallery" },
  { href: "/submit", label: "Submit" },
];
// ponytail: phase links removed mid-workshop; submission is directly open.

export default async function MobileNav() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="md:hidden sticky top-0 z-30 backdrop-blur bg-bg/80 border-b border-white/5">
      <div className="px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-sm font-semibold text-ink">
          simathon
        </Link>
        <div className="ml-auto text-xs">
          {user ? (
            <span className="flex items-center gap-1.5 text-ink/85">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="truncate max-w-[140px]">{user.email}</span>
            </span>
          ) : (
            <Link href="/login" className="px-2.5 py-1 rounded bg-accent text-black font-medium">
              sign in
            </Link>
          )}
        </div>
      </div>
      <nav className="px-4 pb-2 flex gap-4 text-xs overflow-x-auto whitespace-nowrap">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="text-ink/75 hover:text-accent">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
