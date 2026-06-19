import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const GATED_PREFIXES = ["/chat", "/submit", "/gallery", "/participants", "/phase", "/admin"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet: CookieToSet[]) => {
          toSet.forEach((c) => request.cookies.set(c.name, c.value));
          response = NextResponse.next({ request });
          toSet.forEach((c) => response.cookies.set(c.name, c.value, c.options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const gated = GATED_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));

  if (gated && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // No forced onboarding. Home page nags them with a banner instead.
  return response;
}
