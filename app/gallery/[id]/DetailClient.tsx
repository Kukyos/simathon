"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Reaction = { submission_id: string; user_email: string; reaction: "like" | "dislike" };

export default function DetailClient({
  submissionId,
  userEmail,
  isAdmin,
  initialReactions,
  initialStatus,
  initialNote,
}: {
  submissionId: string;
  userEmail: string;
  isAdmin: boolean;
  initialReactions: Reaction[];
  initialStatus: "pending" | "approved" | "rejected";
  initialNote: string | null;
}) {
  const router = useRouter();
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions);
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState(initialNote ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const supabase = supabaseBrowser();

  useEffect(() => {
    async function refetch() {
      const { data } = await supabase
        .from("submission_reactions")
        .select("submission_id,user_email,reaction")
        .eq("submission_id", submissionId);
      if (data) setReactions(data as Reaction[]);
    }
    const ch = supabase
      .channel(`reactions-${submissionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "submission_reactions",
          filter: `submission_id=eq.${submissionId}`,
        },
        refetch,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, submissionId]);

  const likes = reactions.filter((r) => r.reaction === "like").length;
  const dislikes = reactions.filter((r) => r.reaction === "dislike").length;
  const mine = reactions.find((r) => r.user_email.toLowerCase() === userEmail)?.reaction ?? null;

  async function react(choice: "like" | "dislike") {
    const current = mine;
    setReactions((rs) => {
      const others = rs.filter((r) => r.user_email.toLowerCase() !== userEmail);
      if (current === choice) return others;
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

  async function setGalleryStatus(next: "approved" | "rejected" | "pending", askNote = false) {
    let n = note;
    if (askNote && next === "rejected") {
      const prompt = window.prompt(
        "Reason shown to the submitter (optional):",
        note || "",
      );
      if (prompt === null) return; // cancelled
      n = prompt;
    }
    setBusy(true);
    setErr(null);
    const { error } = await supabase
      .from("submissions")
      .update({ gallery_status: next, gallery_note: next === "rejected" ? n : null })
      .eq("id", submissionId);
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setStatus(next);
    if (next !== "rejected") setNote("");
    router.refresh();
  }

  async function deleteSubmission() {
    if (
      !confirm("Delete this submission entirely? This removes it from the participant too. Irreversible.")
    )
      return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase.from("submissions").delete().eq("id", submissionId);
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.push("/gallery");
  }

  return (
    <div className="mt-6 space-y-3">
      {/* Reactions */}
      <div className="flex gap-2">
        <button
          onClick={() => react("like")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm transition ${
            mine === "like"
              ? "border-green-400/60 bg-green-500/15 text-green-200"
              : "border-white/10 hover:bg-white/5"
          }`}
        >
          <span>♥</span>
          <span>{likes}</span>
        </button>
        <button
          onClick={() => react("dislike")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm transition ${
            mine === "dislike"
              ? "border-red-400/60 bg-red-500/15 text-red-200"
              : "border-white/10 hover:bg-white/5"
          }`}
        >
          <span>✕</span>
          <span>{dislikes}</span>
        </button>
      </div>

      {/* Admin controls */}
      {isAdmin && (
        <div className="rounded-xl border border-violet-400/30 bg-violet-500/5 p-3">
          <div className="text-[10px] uppercase tracking-wider text-violet-300 mb-2">
            admin · gallery moderation
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <button
              disabled={busy || status === "approved"}
              onClick={() => setGalleryStatus("approved")}
              className={`px-3 py-1.5 rounded-md border ${
                status === "approved"
                  ? "border-green-400/60 bg-green-500/15 text-green-200"
                  : "border-white/10 hover:bg-white/5"
              } disabled:opacity-50`}
            >
              approve
            </button>
            <button
              disabled={busy || status === "rejected"}
              onClick={() => setGalleryStatus("rejected", true)}
              className={`px-3 py-1.5 rounded-md border ${
                status === "rejected"
                  ? "border-red-400/60 bg-red-500/15 text-red-200"
                  : "border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/10"
              } disabled:opacity-50`}
            >
              reject
            </button>
            <button
              disabled={busy || status === "pending"}
              onClick={() => setGalleryStatus("pending")}
              className="px-3 py-1.5 rounded-md border border-white/10 text-ink/75 hover:bg-white/5 disabled:opacity-50"
            >
              set to pending
            </button>
            <button
              disabled={busy}
              onClick={deleteSubmission}
              className="px-3 py-1.5 rounded-md border border-red-500/40 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
            >
              delete
            </button>
          </div>
          <div className="text-[11px] text-muted mt-2">
            current: <span className="text-ink/80">{status}</span>
            {status === "rejected" && note && <> · note: <span className="text-ink/80">{note}</span></>}
          </div>
        </div>
      )}

      {err && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {err}
        </div>
      )}
    </div>
  );
}
