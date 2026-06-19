import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import AutoRefresh from "@/components/AutoRefresh";

export const metadata = { title: "Gallery · Submitted Sims" };

export default async function GalleryPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/gallery");

  const { data } = await supabase
    .from("submissions")
    .select("id,title,tagline,display_name,user_email,github_url,video_url,screenshot_url,created_at")
    .order("created_at", { ascending: false });

  const subs = data ?? [];

  return (
    <div>
      <AutoRefresh ms={30000} />
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">gallery</div>
      <h1 className="text-3xl font-bold mt-1">What everyone built</h1>
      <p className="text-ink/80 mt-2 text-sm">
        Click through. Get inspired. Steal ideas — that's the whole point of an open showcase.
      </p>

      {subs.length === 0 ? (
        <div className="callout mt-6">
          <div className="text-sm">
            Nobody has submitted yet. Be the first. <Link href="/submit" className="text-accent">Submit your sim →</Link>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          {subs.map((s) => (
            <Link
              key={s.id}
              href={`/gallery/${s.id}`}
              className="group rounded-xl overflow-hidden border border-white/10 bg-panel/60 hover:border-accent/40 transition flex flex-col"
            >
              {s.screenshot_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.screenshot_url} alt={s.title} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-accent2/20 to-accent/20 flex items-center justify-center text-3xl">
                  ▣
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <div className="font-semibold text-ink group-hover:text-accent">{s.title}</div>
                <div className="text-sm text-ink/75 mt-1 line-clamp-2 flex-1">{s.tagline}</div>
                <div className="text-xs text-muted mt-3">
                  by {s.display_name || (s.user_email as string).split("@")[0]}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
