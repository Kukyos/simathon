import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const nextCookie = request.cookies.get("simathon_next")?.value;
  const next = url.searchParams.get("next") || (nextCookie ? decodeURIComponent(nextCookie) : "/setup");

  const response = NextResponse.redirect(`${url.origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet: CookieToSet[]) => {
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Supabase emails arrive in two flavors. Handle both so we don't need users
  // to edit their email template in the dashboard.
  let errMsg: string | null = null;
  if (code) {
    const r = await supabase.auth.exchangeCodeForSession(code);
    if (r.error) errMsg = r.error.message;
  } else if (tokenHash && type) {
    const r = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (r.error) errMsg = r.error.message;
  } else {
    errMsg = "no_code_or_token";
  }

  if (errMsg) {
    console.error("[auth/callback] failed:", errMsg, "url:", url.toString());
    return NextResponse.redirect(
      `${url.origin}/login?error=${encodeURIComponent(errMsg)}`,
    );
  }
  return response;
}
