"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Sub = {
  id: string;
  title: string;
  tagline: string;
  display_name: string | null;
  user_email: string;
  screenshot_url: string | null;
  gallery_status?: "pending" | "approved" | "rejected";
};

type Reaction = {
  submission_id: string;
  user_email: string;
  reaction: "like" | "dislike";
};

export default function GalleryGrid({
  userEmail,
  subs,
  initialReactions,
}: {
  userEmail: string;
  subs: Sub[];
  initialReactions: Reaction[];
}) {
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions);
  const supabase = supabaseBrowser();

  useEffect(() => {
    async function refetch() {
      const { data } = await supabase
        .from("submission_reactions")
        .select("submission_id,user_email,reaction");
      if (data) setReactions(data as Reaction[]);
    }
    const channel = supabase
      .channel("reactions-gallery")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submission_reactions" },
        refetch,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const byId = useMemo(() => {
    const m = new Map<string, { like: number; dislike: number; mine: "like" | "dislike" | null }>();
    for (const s of subs) m.set(s.id, { like: 0, dislike: 0, mine: null });
    for (const r of reactions) {
      const e = m.get(r.submission_id);
      if (!e) continue;
      if (r.reaction === "like") e.like++;
      else e.dislike++;
      if (r.user_email.toLowerCase() === userEmail) e.mine = r.reaction;
    }
    return m;
  }, [subs, reactions, userEmail]);

  async function react(submissionId: string, choice: "like" | "dislike") {
    const current = byId.get(submissionId)?.mine ?? null;
    // optimistic
    setReactions((rs) => {
      const others = rs.filter(
        (r) => !(r.submission_id === submissionId && r.user_email.toLowerCase() === userEmail),
      );
      if (current === choice) return others; // toggle off
      return [...others, { submission_id: submissionId, user_email: userEmail, reaction: choice }];
    });

    if (current === choice) {
      await supabase
        .from("submission_reactions")
        .delete()
        .eq("submission_id", submissionId)
        .eq("user_email", userEmail);
    } else {
      await supabase
        .from("submission_reactions")
        .upsert(
          { submission_id: submissionId, user_email: userEmail, reaction: choice },
          { onConflict: "submission_id,user_email" },
        );
    }
  }

  return (
    <div className="mt-6 columns-1 sm:columns-2 lg:columns-3 gap-3 [column-fill:_balance]">
      {subs.map((s) => {
        const r = byId.get(s.id) ?? { like: 0, dislike: 0, mine: null };
        return (
          <div
            key={s.id}
            className="mb-3 break-inside-avoid rounded-xl overflow-hidden border border-white/10 bg-panel/60 hover:border-accent/40 transition"
          >
            <Link href={`/gallery/${s.id}`} className="block group relative">
              {s.gallery_status && s.gallery_status !== "approved" && (
                <span
                  className={`absolute top-2 right-2 z-10 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                    s.gallery_status === "pending"
                      ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-200"
                      : "bg-red-500/20 border-red-500/40 text-red-200"
                  }`}
                >
                  {s.gallery_status}
                </span>
              )}
              {s.screenshot_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.screenshot_url}
                  alt={s.title}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-accent2/20 to-accent/20 flex items-center justify-center text-3xl">
                  ▣
                </div>
              )}
              <div className="p-3">
                <div className="font-semibold text-ink group-hover:text-accent leading-snug">{s.title}</div>
                <div className="text-xs text-ink/75 mt-1 line-clamp-2">{s.tagline}</div>
                <div className="text-[11px] text-muted mt-2">
                  by {s.display_name || s.user_email.split("@")[0]}
                </div>
              </div>
            </Link>
            <div className="border-t border-white/5 px-2 py-1.5 flex items-center gap-1 text-xs">
              <button
                onClick={() => react(s.id, "like")}
                className={`flex items-center gap-1 px-2 py-1 rounded transition ${
                  r.mine === "like"
                    ? "bg-green-500/15 text-green-300"
                    : "text-ink/70 hover:bg-white/5"
                }`}
              >
                <span>♥</span>
                <span>{r.like}</span>
              </button>
              <button
                onClick={() => react(s.id, "dislike")}
                className={`flex items-center gap-1 px-2 py-1 rounded transition ${
                  r.mine === "dislike"
                    ? "bg-red-500/15 text-red-300"
                    : "text-ink/70 hover:bg-white/5"
                }`}
              >
                <span>✕</span>
                <span>{r.dislike}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
