import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { isAdmin as checkIsAdmin } from "@/lib/admin";
import { isWorkshopOpen, workshopStartAtIso } from "@/lib/lock";
import LockedScreen from "@/components/LockedScreen";
import GalleryGrid from "./GalleryGrid";

export const metadata = { title: "Gallery · Submitted Sims" };

export default async function GalleryPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/gallery");
  const myEmail = user.email!.toLowerCase();
  const isAdmin = await checkIsAdmin(supabase, user.email);

  if (!isWorkshopOpen() && !isAdmin) {
    return <LockedScreen startsAtIso={workshopStartAtIso()} title="Gallery opens when the workshop starts." blurb="Nothing to show yet — submissions arrive once we've built our sims." />;
  }

  // Admins see every submission (so they can moderate). Everyone else only sees approved.
  let q = supabase
    .from("submissions")
    .select("id,title,tagline,display_name,user_email,screenshot_url,gallery_status")
    .order("created_at", { ascending: false });
  if (!isAdmin) q = q.eq("gallery_status", "approved");

  const [{ data: subs }, { data: reactions }] = await Promise.all([
    q,
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
        <>
          {isAdmin && (
            <div className="mt-4 rounded-md border border-violet-400/30 bg-violet-500/5 px-3 py-2 text-xs text-violet-200">
              Admin view · you see every submission including pending and rejected. Click a card to moderate.
            </div>
          )}
          <GalleryGrid
            userEmail={myEmail}
            subs={list}
            initialReactions={(reactions ?? []) as any}
          />
        </>
      )}
    </div>
  );
}
