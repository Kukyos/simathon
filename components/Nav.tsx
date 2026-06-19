import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

const links = [
  { href: "/", label: "Home" },
  { href: "/setup", label: "Setup" },
  { href: "/workshop", label: "Workshop" },
  { href: "/hackathon", label: "Hackathon" },
  { href: "/chat", label: "Chat" },
  { href: "/submit", label: "Submit" },
  { href: "/gallery", label: "Gallery" },
];

export default async function Nav() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-bg/70 border-b border-white/5">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center gap-6">
        <Link href="/" className="font-bold tracking-tight text-lg">
          <span className="text-accent">simulate</span>.the.<span className="text-accent2">impossible</span>
        </Link>
        <nav className="hidden md:flex gap-5 text-sm text-ink/80">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-accent transition-colors">{l.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden sm:inline text-muted">{user.email}</span>
              <SignOutButton />
            </>
          ) : (
            <Link href="/login" className="px-3 py-1.5 rounded-md bg-accent text-black font-medium hover:opacity-90">
              Sign in
            </Link>
          )}
        </div>
      </div>
      <div className="md:hidden border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5 py-2 flex gap-4 text-xs overflow-x-auto whitespace-nowrap">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-ink/70 hover:text-accent">{l.label}</Link>
          ))}
        </div>
      </div>
    </header>
  );
}
