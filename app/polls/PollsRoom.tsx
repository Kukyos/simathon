"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Poll = {
  id: number;
  question: string;
  created_by: string;
  created_at: string;
  closed_at: string | null;
  options: string[];
  multi_choice: boolean;
  default_no: boolean;
};

type Vote = {
  poll_id: number;
  user_email: string;
  choice: string;
};

// Form mode is a lazy UI grouping over the 3 flags. Maps both ways.
type Mode = "yesno" | "ready" | "single" | "multi";

function modeOf(p: Pick<Poll, "options" | "multi_choice" | "default_no">): Mode {
  if (p.default_no) return "ready";
  const yn = p.options.length === 2 && p.options[0] === "Yes" && p.options[1] === "No";
  if (yn && !p.multi_choice) return "yesno";
  return p.multi_choice ? "multi" : "single";
}

const MODE_DEFAULTS: Record<Mode, { options: string[]; multi_choice: boolean; default_no: boolean }> = {
  yesno:  { options: ["Yes", "No"], multi_choice: false, default_no: false },
  ready:  { options: ["Yes", "No"], multi_choice: false, default_no: true  },
  single: { options: ["", ""],      multi_choice: false, default_no: false },
  multi:  { options: ["", ""],      multi_choice: true,  default_no: false },
};

function arraysEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export default function PollsRoom({
  userEmail,
  isAdmin,
  participantCount,
  initialPolls,
  initialVotes,
}: {
  userEmail: string;
  isAdmin: boolean;
  participantCount: number;
  initialPolls: Poll[];
  initialVotes: Vote[];
}) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [votes, setVotes] = useState<Vote[]>(initialVotes);
  const [err, setErr] = useState<string | null>(null);
  const supabase = supabaseBrowser();

  // Form state (used for both new + edit)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("yesno");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["Yes", "No"]);
  const [busy, setBusy] = useState(false);

  // Realtime: full refetch on any change.
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

  function resetForm() {
    setEditingId(null);
    setMode("yesno");
    setQuestion("");
    setOptions(["Yes", "No"]);
  }

  function applyMode(m: Mode) {
    setMode(m);
    setOptions(MODE_DEFAULTS[m].options);
  }

  function startEdit(p: Poll) {
    setEditingId(p.id);
    setMode(modeOf(p));
    setQuestion(p.question);
    setOptions(p.options.slice());
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;

    const cfg = MODE_DEFAULTS[mode];
    const cleanedOptions =
      mode === "yesno" || mode === "ready"
        ? cfg.options
        : options.map((o) => o.trim()).filter((o) => o.length > 0);

    if ((mode === "single" || mode === "multi") && cleanedOptions.length < 2) {
      setErr("Need at least 2 non-empty options.");
      return;
    }
    if (cleanedOptions.length > 4) {
      setErr("Max 4 options.");
      return;
    }

    setBusy(true);
    setErr(null);

    if (editingId == null) {
      const { error } = await supabase.from("polls").insert({
        question: q,
        created_by: userEmail,
        options: cleanedOptions,
        multi_choice: cfg.multi_choice,
        default_no: cfg.default_no,
      });
      if (error) setErr(error.message);
    } else {
      const original = polls.find((p) => p.id === editingId);
      const structureChanged =
        !original ||
        !arraysEqual(original.options, cleanedOptions) ||
        original.multi_choice !== cfg.multi_choice ||
        original.default_no !== cfg.default_no;

      if (structureChanged && original) {
        if (!confirm("Saving this edit will wipe existing votes on this poll. Continue?")) {
          setBusy(false);
          return;
        }
        await supabase.from("poll_votes").delete().eq("poll_id", editingId);
      }
      const { error } = await supabase
        .from("polls")
        .update({
          question: q,
          options: cleanedOptions,
          multi_choice: cfg.multi_choice,
          default_no: cfg.default_no,
        })
        .eq("id", editingId);
      if (error) setErr(error.message);
    }

    setBusy(false);
    resetForm();
  }

  async function toggleVote(poll: Poll, choice: string) {
    setErr(null);
    const myEmailLc = userEmail;
    const mine = votes.filter(
      (v) => v.poll_id === poll.id && v.user_email.toLowerCase() === myEmailLc,
    );

    if (poll.multi_choice) {
      const existing = mine.find((v) => v.choice === choice);
      if (existing) {
        // optimistic remove
        setVotes((vs) =>
          vs.filter(
            (v) =>
              !(v.poll_id === poll.id && v.user_email.toLowerCase() === myEmailLc && v.choice === choice),
          ),
        );
        const { error } = await supabase
          .from("poll_votes")
          .delete()
          .eq("poll_id", poll.id)
          .eq("user_email", userEmail)
          .eq("choice", choice);
        if (error) setErr(error.message);
      } else {
        setVotes((vs) => [...vs, { poll_id: poll.id, user_email: userEmail, choice }]);
        const { error } = await supabase
          .from("poll_votes")
          .insert({ poll_id: poll.id, user_email: userEmail, choice });
        if (error) setErr(error.message);
      }
    } else {
      // single-choice: clicking my current choice → toggle off (un-vote). Otherwise swap.
      if (mine.length === 1 && mine[0].choice === choice) {
        setVotes((vs) =>
          vs.filter((v) => !(v.poll_id === poll.id && v.user_email.toLowerCase() === myEmailLc)),
        );
        const { error } = await supabase
          .from("poll_votes")
          .delete()
          .eq("poll_id", poll.id)
          .eq("user_email", userEmail);
        if (error) setErr(error.message);
        return;
      }
      // optimistic swap
      setVotes((vs) => [
        ...vs.filter((v) => !(v.poll_id === poll.id && v.user_email.toLowerCase() === myEmailLc)),
        { poll_id: poll.id, user_email: userEmail, choice },
      ]);
      await supabase
        .from("poll_votes")
        .delete()
        .eq("poll_id", poll.id)
        .eq("user_email", userEmail);
      const { error } = await supabase
        .from("poll_votes")
        .insert({ poll_id: poll.id, user_email: userEmail, choice });
      if (error) setErr(error.message);
    }
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

  const active = useMemo(() => polls.filter((p) => !p.closed_at), [polls]);
  const closed = useMemo(() => polls.filter((p) => !!p.closed_at), [polls]);

  return (
    <div className="mt-6 space-y-6">
      {isAdmin && (
        <form
          onSubmit={submitForm}
          className="rounded-xl border border-violet-400/30 bg-violet-500/5 p-4 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] uppercase tracking-wider text-violet-300">
              admin · {editingId == null ? "new poll" : `edit poll #${editingId}`}
            </div>
            {editingId != null && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[11px] text-muted hover:text-ink"
              >
                cancel edit
              </button>
            )}
          </div>

          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Should I proceed to the next demo?"
            maxLength={200}
            className="w-full rounded-md bg-bg border border-white/10 px-3 py-2 focus:outline-none focus:border-accent text-sm"
          />

          {/* Mode picker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs">
            {(["yesno", "ready", "single", "multi"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => applyMode(m)}
                className={`px-2 py-1.5 rounded border transition ${
                  mode === m
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : "border-white/10 text-ink/70 hover:bg-white/5"
                }`}
              >
                {m === "yesno" && "Yes / No"}
                {m === "ready" && "Ready check"}
                {m === "single" && "Pick one"}
                {m === "multi" && "Pick many"}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-muted">
            {mode === "yesno" && "Standard yes/no. Tally vs. people who voted."}
            {mode === "ready" && `Yes-only check-in. Tally vs. all ${participantCount} participants — anyone who hasn't clicked yet counts as no.`}
            {mode === "single" && "Custom options. One per voter."}
            {mode === "multi" && "Custom options. Voters can pick more than one."}
          </div>

          {(mode === "single" || mode === "multi") && (
            <div className="space-y-1.5">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-[11px] text-muted w-4 text-right">{i + 1}.</span>
                  <input
                    value={opt}
                    onChange={(e) =>
                      setOptions((arr) => arr.map((v, j) => (j === i ? e.target.value : v)))
                    }
                    placeholder={`option ${i + 1}`}
                    maxLength={60}
                    className="flex-1 rounded-md bg-bg border border-white/10 px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setOptions((arr) => arr.filter((_, j) => j !== i))}
                      className="text-xs text-red-300 hover:text-red-200 px-2"
                      title="remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {options.length < 4 && (
                <button
                  type="button"
                  onClick={() => setOptions((arr) => [...arr, ""])}
                  className="text-xs text-accent hover:underline"
                >
                  + add option
                </button>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="submit"
              disabled={busy || !question.trim()}
              className="px-4 py-2 rounded-md bg-accent text-black font-semibold text-sm disabled:opacity-50"
            >
              {editingId == null ? "ask" : "save"}
            </button>
          </div>
        </form>
      )}

      {err && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {err}
        </div>
      )}

      {polls.length === 0 && (
        <div className="text-sm text-muted">
          No polls yet. {isAdmin ? "Ask one ↑" : "Wait for the host to ask something."}
        </div>
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
                participantCount={participantCount}
                onVote={toggleVote}
                onClose={closePoll}
                onDelete={deletePoll}
                onEdit={startEdit}
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
                participantCount={participantCount}
                onVote={toggleVote}
                onClose={closePoll}
                onReopen={reopenPoll}
                onDelete={deletePoll}
                onEdit={startEdit}
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
  participantCount,
  onVote,
  onClose,
  onReopen,
  onDelete,
  onEdit,
}: {
  poll: Poll;
  votes: Vote[];
  userEmail: string;
  isAdmin: boolean;
  participantCount: number;
  onVote: (poll: Poll, choice: string) => void;
  onClose: (id: number) => void;
  onReopen?: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (poll: Poll) => void;
}) {
  const isClosed = !!poll.closed_at;
  const myVotes = votes.filter(
    (v) => v.poll_id === poll.id && v.user_email.toLowerCase() === userEmail,
  );
  const myVoteSet = new Set(myVotes.map((v) => v.choice));

  const counts: Record<string, number> = Object.fromEntries(poll.options.map((o) => [o, 0]));
  for (const v of votes) {
    if (v.poll_id === poll.id && counts[v.choice] !== undefined) counts[v.choice]++;
  }
  const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);

  // In default_no mode: tally is options[0] vs. total participants.
  // Show only options[0] as a toggle button.
  const renderOptions = poll.default_no ? poll.options.slice(0, 1) : poll.options;
  const denom = poll.default_no ? Math.max(participantCount, counts[poll.options[0]] || 0) : totalVotes;

  return (
    <li className="rounded-xl border border-white/10 bg-panel/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-ink font-semibold flex-1">{poll.question}</div>
        {isAdmin && (
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => onEdit(poll)}
              className="text-[11px] px-2 py-0.5 rounded border border-white/15 text-ink/70 hover:bg-white/5"
            >
              edit
            </button>
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

      <div
        className={`mt-3 grid gap-2 ${
          renderOptions.length === 1
            ? "grid-cols-1"
            : renderOptions.length === 2
              ? "grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2"
        }`}
      >
        {renderOptions.map((opt) => {
          const c = counts[opt] || 0;
          const pct = denom ? Math.round((c / denom) * 100) : 0;
          const mine = myVoteSet.has(opt);
          return (
            <button
              key={opt}
              onClick={() => !isClosed && onVote(poll, opt)}
              disabled={isClosed}
              className={`relative overflow-hidden rounded-md border px-3 py-2 text-sm transition ${
                mine
                  ? "border-accent/60 bg-accent/10 text-ink"
                  : "border-white/10 hover:border-accent/40 hover:bg-white/5"
              } disabled:cursor-not-allowed disabled:opacity-70`}
            >
              <span
                className="absolute inset-y-0 left-0 bg-accent/15 transition-[width]"
                style={{ width: `${pct}%` }}
              />
              <span className="relative flex justify-between items-center">
                <span className="font-semibold truncate pr-2">{opt}</span>
                <span className="text-xs text-ink/70 shrink-0">
                  {c}
                  {denom > 0 && ` · ${pct}%`}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 text-[11px] text-muted flex items-center gap-2 flex-wrap">
        {poll.default_no ? (
          <span>
            {counts[poll.options[0]] || 0} of {participantCount} ready
          </span>
        ) : (
          <span>
            {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
          </span>
        )}
        <span>·</span>
        <span>
          {new Date(poll.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        {poll.multi_choice && <><span>·</span><span>pick many</span></>}
        {isClosed && <><span>·</span><span className="text-yellow-300">closed</span></>}
        {myVotes.length > 0 && !isClosed && (
          <>
            <span>·</span>
            <span className="text-accent">
              you voted {myVotes.map((v) => v.choice).join(", ")}
            </span>
          </>
        )}
      </div>
    </li>
  );
}
