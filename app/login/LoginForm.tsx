"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const params = useSearchParams();
  const next = params.get("next") || "/setup";
  const urlError = params.get("error");

  useEffect(() => {
    if (urlError) {
      setState("error");
      setError(
        `Sign-in didn't complete: ${urlError}. Try requesting a new link, and click it in the same browser you requested it from.`,
      );
    }
  }, [urlError]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");

    const supabase = supabaseBrowser();
    const cleaned = email.trim().toLowerCase();

    // Pre-check the allowlist so non-registered emails get a clear error
    // instead of a "check your email" that never arrives.
    const { data: ok, error: lookupErr } = await supabase
      .rpc("is_email_allowed", { check_email: cleaned });

    if (lookupErr) {
      setState("error");
      setError("Couldn't reach the server. Check your internet and try again.");
      return;
    }
    if (!ok) {
      setState("error");
      setError(
        "We don't see your email on the registered list. Use the same address you registered with — or reach out to the organizers if you think this is wrong.",
      );
      return;
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || window.location.origin;

    // Keep emailRedirectTo as plain path so Supabase's redirect-URL allow-list
    // matches exactly. Store the "next" path in a short-lived cookie instead.
    document.cookie = `simathon_next=${encodeURIComponent(next)}; path=/; max-age=600; SameSite=Lax`;

    const { error: signErr } = await supabase.auth.signInWithOtp({
      email: cleaned,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });
    if (signErr) {
      setState("error");
      setError(signErr.message);
      return;
    }
    setState("sent");
  }

  return (
    <div className="max-w-md mx-auto pt-10">
      <h1 className="text-3xl font-bold mb-2">Sign in</h1>
      <p className="text-muted mb-6 text-sm">
        Enter the email you registered with. We&apos;ll send you a one-click sign-in link — no password to remember.
      </p>

      {state === "sent" ? (
        <div className="callout check">
          <div className="font-semibold mb-1">Check your inbox</div>
          <div className="text-sm text-ink/90">
            We sent a magic link to <span className="text-accent">{email}</span>. Click it
            and you&apos;ll land right back here, signed in. If you don&apos;t see it in 60
            seconds, check spam.
          </div>
        </div>
      ) : (
        <form onSubmit={send} className="space-y-3">
          <input
            type="email"
            required
            placeholder="you@yourschool.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-panel border border-white/10 px-3 py-2 focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="w-full px-4 py-2 rounded-md bg-accent text-black font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {state === "sending" ? "Sending..." : "Send me a magic link"}
          </button>
          {state === "error" && (
            <div className="callout warn text-sm">{error}</div>
          )}
        </form>
      )}

      <div className="mt-6 text-xs text-muted">
        Trouble logging in? Reply to your registration email.
      </div>
    </div>
  );
}
