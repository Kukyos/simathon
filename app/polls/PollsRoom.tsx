"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Poll = {
  id: number;
  question: string;
  created_by: string;
  created_at: string;
  closed_at: string | null;
};

type Vote = {
  poll_id: number;
  user_email: string;
  choice: "yes" | "no";
};

export default function PollsRoom({
  userEmail,
  isAdmin,
  initialPolls,
  initialVotes,
}: {
  userEmail: string;
  isAdmin: boolean;
  initialPolls: Poll[];
  initialVotes: Vote[];
}) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [votes, setVotes] = useState<Vote[]>(initialVotes);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const supabase = supabaseBrowser();

  // Realtime: refetch on any change. With ~50 students and ~10 polls this is trivial
  // and avoids fiddly diffing of inserts/updates/deletes across two tables.
  // ponytail: full refetch on every event. fine at this scale; switch to delta if it ever isn't.
  useEffect(() => {
    async function refetch() {
      const [{ data: p }, { data: v }] = await Promise.all([
        supabase.from("polls").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("poll_votes").select("poll_id,user_email,choice"),
      ]);
      if (p) setPolls(p as Poll[]);
      if (v) setVotes(v as Vote[]);
    }
    const channel = supabase
      .channel("polls-room")
      .on("postgres_changes", { event: "*", schema: "public", table: "polls" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_votes" }, refetch)
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") console.warn("[polls] realtime status:", status);
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function createPoll(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase.from("polls").insert({ question: q, created_by: userEmail });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setQuestion("");
  }

  async function vote(pollId: number, choice: "yes" | "no") {
    setErr(null);
    // Optimistic: drop any existing vote of mine on this poll, append new one.
    setVotes((vs) => [
      ...vs.filter((v) => !(v.poll_id === pollId && v.user_email.toLowerCase() === userEmail)),
      { poll_id: pollId, user_email: userEmail, choice },
    ]);
    const { error } = await supabase
      .from("poll_votes")
      .upsert({ poll_id: pollId, user_email: userEmail, choice }, { onConflict: "poll_id,user_email" });
    if (error) setErr(error.message);
  }

  async function closePoll(pollId: number) {
    if (!confirm("Close this poll? Votes are locked after closing.")) return;
    const { error } = await supabase
      .from("polls")
      .update({ closed_at: new Date().toISOString() })
      .eq("id", pollId);
    if (error) setErr(error.message);
  }

  async function reopenPoll(pollId: number) {
    const { error } = await supabase.from("polls").update({ closed_at: null }).eq("id", pollId);
    if (error) setErr(error.message);
  }

  async function deletePoll(pollId: number) {
    if (!confirm("Delete this poll and all its votes?")) return;
    const { error } = await supabase.from("polls").delete().eq("id", pollId);
    if (error) setErr(error.message);
  }

  const active = polls.filter((p) => !p.closed_at);
  const closed = polls.filter((p) => !!p.closed_at);

  return (
    <div className="mt-6 space-y-6">
      {isAdmin && (
        <form
          onSubmit={createPoll}
          className="rounded-xl border border-violet-400/30 bg-violet-500/5 p-4 space-y-2"
        >
          <div className="text-[10px] uppercase tracking-wider text-violet-300">admin · new poll</div>
          <div className="flex gap-2 items-center">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Should I proceed to the next demo?"
              maxLength={200}
              className="flex-1 rounded-md bg-bg border border-white/10 px-3 py-2 focus:outline-none focus:border-accent text-sm"
            />
            <button
              type="submit"
              disabled={busy || !question.trim()}
              className="px-4 py-2 rounded-md bg-accent text-black font-semibold text-sm disabled:opacity-50"
            >
              ask
            </button>
          </div>
          <div className="text-xs text-muted">Yes / No only. Everyone votes live.</div>
        </form>
      )}

      {err && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {err}
        </div>
      )}

      {polls.length === 0 && (
        <div className="text-sm text-muted">No polls yet. {isAdmin ? "Ask one ↑" : "Wait for the host to ask something."}</div>
      )}

      {active.length > 0 && (
        <section>
          <div className="text-xs uppercase tracking-[0.18em] text-muted mb-2">open</div>
          <ul className="space-y-3">
            {active.map((p) => (
              <PollCard
                key={p.id}
                poll={p}
                votes={votes}
                userEmail={userEmail}
                isAdmin={isAdmin}
                onVote={vote}
                onClose={closePoll}
                onDelete={deletePoll}
              />
            ))}
          </ul>
        </section>
      )}

      {closed.length > 0 && (
        <section>
          <div className="text-xs uppercase tracking-[0.18em] text-muted mb-2">closed</div>
          <ul className="space-y-3">
            {closed.map((p) => (
              <PollCard
                key={p.id}
                poll={p}
                votes={votes}
                userEmail={userEmail}
                isAdmin={isAdmin}
                onVote={vote}
                onClose={closePoll}
                onReopen={reopenPoll}
                onDelete={deletePoll}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function PollCard({
  poll,
  votes,
  userEmail,
  isAdmin,
  onVote,
  onClose,
  onReopen,
  onDelete,
}: {
  poll: Poll;
  votes: Vote[];
  userEmail: string;
  isAdmin: boolean;
  onVote: (id: number, choice: "yes" | "no") => void;
  onClose: (id: number) => void;
  onReopen?: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const mine = votes.find((v) => v.poll_id === poll.id && v.user_email.toLowerCase() === userEmail);
  const yes = votes.filter((v) => v.poll_id === poll.id && v.choice === "yes").length;
  const no = votes.filter((v) => v.poll_id === poll.id && v.choice === "no").length;
  const total = yes + no;
  const yesPct = total ? Math.round((yes / total) * 100) : 0;
  const noPct = total ? 100 - yesPct : 0;
  const isClosed = !!poll.closed_at;

  return (
    <li className="rounded-xl border border-white/10 bg-panel/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-ink font-semibold flex-1">{poll.question}</div>
        {isAdmin && (
          <div className="flex gap-1 shrink-0">
            {isClosed ? (
              <button
                onClick={() => onReopen?.(poll.id)}
                className="text-[11px] px-2 py-0.5 rounded border border-white/15 text-ink/70 hover:bg-white/5"
              >
                reopen
              </button>
            ) : (
              <button
                onClick={() => onClose(poll.id)}
                className="text-[11px] px-2 py-0.5 rounded border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/10"
              >
                close
              </button>
            )}
            <button
              onClick={() => onDelete(poll.id)}
              className="text-[11px] px-2 py-0.5 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10"
            >
              delete
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => !isClosed && onVote(poll.id, "yes")}
          disabled={isClosed}
          className={`relative overflow-hidden rounded-md border px-3 py-2 text-sm transition ${
            mine?.choice === "yes"
              ? "border-green-400/60 bg-green-500/10 text-green-200"
              : "border-white/10 hover:border-green-400/40 hover:bg-green-500/5"
          } disabled:cursor-not-allowed disabled:opacity-70`}
        >
          <span
            className="absolute inset-y-0 left-0 bg-green-500/15 transition-[width]"
            style={{ width: `${yesPct}%` }}
          />
          <span className="relative flex justify-between">
            <span className="font-semibold">Yes</span>
            <span className="text-xs text-ink/70">{yes} · {yesPct}%</span>
          </span>
        </button>
        <button
          onClick={() => !isClosed && onVote(poll.id, "no")}
          disabled={isClosed}
          className={`relative overflow-hidden rounded-md border px-3 py-2 text-sm transition ${
            mine?.choice === "no"
              ? "border-red-400/60 bg-red-500/10 text-red-200"
              : "border-white/10 hover:border-red-400/40 hover:bg-red-500/5"
          } disabled:cursor-not-allowed disabled:opacity-70`}
        >
          <span
            className="absolute inset-y-0 left-0 bg-red-500/15 transition-[width]"
            style={{ width: `${noPct}%` }}
          />
          <span className="relative flex justify-between">
            <span className="font-semibold">No</span>
            <span className="text-xs text-ink/70">{no} · {noPct}%</span>
          </span>
        </button>
      </div>

      <div className="mt-2 text-[11px] text-muted flex items-center gap-2">
        <span>{total} {total === 1 ? "vote" : "votes"}</span>
        <span>·</span>
        <span>{new Date(poll.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        {isClosed && <><span>·</span><span className="text-yellow-300">closed</span></>}
        {mine && !isClosed && <><span>·</span><span className="text-accent">you voted {mine.choice}</span></>}
      </div>
    </li>
  );
}
