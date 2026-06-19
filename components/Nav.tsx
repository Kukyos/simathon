import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

const links = [
  { href: "/setup", label: "Setup" },
  { href: "/workshop", label: "Build" },
  { href: "/hackathon", label: "Hackathon" },
  { href: "/chat", label: "Chat" },
  { href: "/submit", label: "Submit" },
  { href: "/gallery", label: "Gallery" },
];

export default async function Nav() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-bg/80 border-b border-white/5">
      <div className="max-w-5xl mx-auto px-5 py-3 flex items-center gap-5">
        <Link href="/" className="text-sm font-semibold tracking-tight text-ink">
          simathon
        </Link>
        <nav className="hidden md:flex gap-4 text-sm text-ink/75">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-accent transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-xs">
          {user ? (
            <>
              <span className="flex items-center gap-1.5 text-ink/85">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="hidden sm:inline">{user.email}</span>
              </span>
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-md bg-accent text-black font-medium hover:opacity-90"
            >
              sign in
            </Link>
          )}
        </div>
      </div>
      <div className="md:hidden border-t border-white/5">
        <div className="max-w-5xl mx-auto px-5 py-2 flex gap-4 text-xs overflow-x-auto whitespace-nowrap">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-ink/70 hover:text-accent">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
