import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import GalleryGrid from "./GalleryGrid";

export const metadata = { title: "Gallery · Submitted Sims" };

export default async function GalleryPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/gallery");
  const myEmail = user.email!.toLowerCase();

  const [{ data: subs }, { data: reactions }] = await Promise.all([
    supabase
      .from("submissions")
      .select("id,title,tagline,display_name,user_email,screenshot_url")
      .eq("gallery_status", "approved")
      .order("created_at", { ascending: false }),
    supabase.from("submission_reactions").select("submission_id,user_email,reaction"),
  ]);

  const list = subs ?? [];

  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">gallery</div>
      <h1 className="text-3xl font-bold mt-1">What everyone built</h1>
      <p className="text-ink/80 mt-2 text-sm">
        Click through. Get inspired. Steal ideas — that's the whole point of an open showcase.
      </p>

      {list.length === 0 ? (
        <div className="callout mt-6">
          <div className="text-sm">
            Nothing approved yet. <Link href="/submit" className="text-accent">Submit your sim →</Link>
          </div>
        </div>
      ) : (
        <GalleryGrid
          userEmail={myEmail}
          subs={list}
          initialReactions={(reactions ?? []) as any}
        />
      )}
    </div>
  );
}
