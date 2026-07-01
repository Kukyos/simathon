import { createBrowserClient } from "@supabase/ssr";

// ponytail: implicit flow instead of default PKCE. Trade-off: slightly less
// secure token-in-URL model, but magic links survive cross-browser (phone→laptop)
// and stale-link clicks. For a 1-week disposable event this is the right call —
// the PKCE code-verifier cookie mismatch is the #1 way real users get locked out.
// Callback route already handles the token_hash format that implicit flow uses.
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { flowType: "implicit" } },
  );
}
