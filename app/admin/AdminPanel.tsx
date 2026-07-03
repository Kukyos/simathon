"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import AutoRefresh from "@/components/AutoRefresh";
import type { ParticipantRow, PendingRow } from "./page";

type Tab = "reviews" | "people";

const STATUS_COLOR: Record<string, string> = {
  approved: "text-green-300",
  pending: "text-yellow-300",
  rejected: "text-red-300",
};

export default function AdminPanel({
  participants,
  pending,
  signupsOpen,
}: {
  participants: ParticipantRow[];
  pending: PendingRow[];
  signupsOpen: boolean;
}) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>(pending.length ? "reviews" : "people");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addEmail, setAddEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(signupsOpen);
  const [lockBusy, setLockBusy] = useState(false);

  async function toggleSignups() {
    const next = !open;
    if (next && !confirm("Unlock sign-ups? ANYONE with any email will be able to sign in and join, not just your registered list. Only do this for live walk-ins.")) return;
    setLockBusy(true);
    const { error } = await supabase.rpc("admin_set_signups_open", { p_open: next });
    setLockBusy(false);
    if (error) setMsg(error.message);
    else {
      setOpen(next);
      startTransition(() => router.refresh());
    }
  }

  async function review(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    const { error } = await supabase.rpc("review_phase", {
      target_id: id,
      new_status: status,
    });
    setBusyId(null);
    if (error) setMsg(error.message);
    else startTransition(() => router.refresh());
  }

  const ADD_LABEL: Record<string, (e: string) => string> = {
    added: (e) => `✓ added ${e} — they can now sign in and onboard.`,
    exists: (e) => `⚠ ${e} is ALREADY on the list (hasn't signed in yet).`,
    exists_signed_in: (e) => `⚠ ${e} is ALREADY on the list and has signed in.`,
  };

  async function addParticipant(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const clean = addEmail.trim().toLowerCase();
    if (!clean) return;
    const { data, error } = await supabase.rpc("admin_add_participant", {
      p_email: clean,
      p_name: null,
    });
    if (error) setMsg(error.message);
    else {
      setMsg((ADD_LABEL[data as string] ?? ADD_LABEL.added)(clean));
      setAddEmail("");
      startTransition(() => router.refresh());
    }
  }

  async function addMany(raw: string) {
    setMsg(null);
    const tokens = raw
      .split(/[,\s\n]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const invalid = tokens.filter((t) => !/.+@.+\..+/.test(t));
    const emails = [...new Set(tokens.filter((t) => /.+@.+\..+/.test(t)))];
    const dupes = tokens.length - invalid.length - emails.length;
    if (!emails.length && !invalid.length) return;
    let added = 0;
    let existing = 0;
    const failed: string[] = [];
    for (const email of emails) {
      const { data, error } = await supabase.rpc("admin_add_participant", {
        p_email: email,
        p_name: null,
      });
      if (error) failed.push(`${email} (${error.message})`);
      else if (data === "added") added++;
      else existing++;
    }
    const parts = [`${added} new`, `${existing} already on list`];
    if (dupes) parts.push(`${dupes} duplicated in your paste`);
    if (failed.length) parts.push(`FAILED: ${failed.join(", ")}`);
    if (invalid.length) parts.push(`skipped as invalid: ${invalid.join(", ")}`);
    setMsg(`${parts.join(" · ")} — total on list should now be checkable in the tab count. Re-paste the same list anytime to verify: it will report 0 new if everyone is in.`);
    startTransition(() => router.refresh());
  }

  async function forcePhase(email: string, phase: number, status: string | null) {
    const approving = status !== "approved";
    if (
      !confirm(
        approving
          ? `Force-approve phase ${phase} for ${email}? Works even without a submission.`
          : `Reset phase ${phase} for ${email} back to nothing? Their upload record for this phase is wiped.`,
      )
    )
      return;
    setBusyId(`${email}-p${phase}`);
    const { error } = await supabase.rpc("admin_set_phase", {
      p_email: email,
      p_phase: phase,
      p_status: approving ? "approved" : "none",
    });
    setBusyId(null);
    if (error) setMsg(error.message);
    else startTransition(() => router.refresh());
  }

  async function approveAllPending() {
    if (!confirm(`Approve ALL ${pending.length} pending phase submissions?`)) return;
    setBusyId("approve-all");
    const { data, error } = await supabase.rpc("admin_approve_all_pending");
    setBusyId(null);
    if (error) setMsg(error.message);
    else {
      setMsg(`✓ approved ${data} pending submission(s).`);
      startTransition(() => router.refresh());
    }
  }

  async function removeParticipant(email: string) {
    if (!confirm(`Remove ${email} completely? Their phases + submission will be deleted.`)) return;
    const { error } = await supabase.rpc("admin_remove_participant", { p_email: email });
    if (error) setMsg(error.message);
    else startTransition(() => router.refresh());
  }

  async function toggleAdmin(email: string, currently: boolean) {
    const { error } = await supabase.rpc("admin_set_admin", {
      p_email: email,
      p_is_admin: !currently,
    });
    if (error) setMsg(error.message);
    else startTransition(() => router.refresh());
  }

  return (
    <div>
      <AutoRefresh ms={20000} />
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">admin panel</div>
      <h1 className="text-3xl font-bold mt-1">Control room</h1>

      {/* Sign-up lock */}
      <div
        className={`mt-5 rounded-xl border p-3 flex items-center justify-between gap-3 ${
          open ? "border-yellow-500/40 bg-yellow-500/5" : "border-white/10 bg-panel/40"
        }`}
      >
        <div>
          <div className="text-sm font-semibold text-ink">
            Sign-ups: {open ? "🔓 OPEN to anyone" : "🔒 registered emails only"}
          </div>
          <div className="text-xs text-muted mt-0.5">
            {open
              ? "Anyone with any email can sign in and is auto-added to the roster. Lock this back before you walk away."
              : "Only emails on your list below can sign in. Unlock only for live walk-ins."}
          </div>
        </div>
        <button
          onClick={toggleSignups}
          disabled={lockBusy}
          className={`shrink-0 px-3 py-1.5 rounded text-sm font-semibold disabled:opacity-50 ${
            open
              ? "bg-accent text-black"
              : "border border-yellow-500/40 text-yellow-200 hover:bg-yellow-500/10"
          }`}
        >
          {lockBusy ? "…" : open ? "Lock it" : "Unlock"}
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b border-white/10">
        {(
          [
            { v: "reviews" as const, label: `Reviews · ${pending.length}` },
            { v: "people" as const, label: `Participants · ${participants.length}` },
          ]
        ).map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px ${
              tab === t.v ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && <div className="mt-3 callout text-xs">{msg}</div>}

      {/* Reviews */}
      {tab === "reviews" && (
        <section className="mt-5">
          {pending.length === 0 ? (
            <div className="text-sm text-muted">Nothing pending. You're free.</div>
          ) : (
            <>
            <button
              onClick={approveAllPending}
              disabled={busyId === "approve-all"}
              className="mb-3 px-3 py-1.5 rounded bg-green-500/15 border border-green-500/40 text-green-200 text-xs font-semibold hover:bg-green-500/25 disabled:opacity-50"
            >
              {busyId === "approve-all" ? "…" : `approve all ${pending.length}`}
            </button>
            <ul className="space-y-3">
              {pending.map((p) => (
                <li key={p.id} className="rounded-xl border border-white/10 bg-panel/40 p-3 flex gap-3">
                  <a href={p.proof_url ?? "#"} target="_blank" rel="noreferrer" className="shrink-0">
                    {p.proof_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.proof_url}
                        alt={`phase ${p.phase} proof`}
                        className="w-28 h-28 object-cover rounded border border-white/10"
                      />
                    ) : (
                      <div className="w-28 h-28 rounded border border-white/10 bg-white/5 flex items-center justify-center text-muted text-xs">
                        no file
                      </div>
                    )}
                  </a>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-xs text-accent2">phase {p.phase}</span>
                      <span className="text-ink truncate">{p.user_email}</span>
                    </div>
                    {p.caption && (
                      <div className="text-xs text-ink/80 mt-1 line-clamp-3">{p.caption}</div>
                    )}
                    <div className="text-[10px] text-muted mt-1">
                      submitted {new Date(p.submitted_at).toLocaleString()}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => review(p.id, "approved")}
                        disabled={busyId === p.id}
                        className="px-3 py-1 rounded bg-green-500/20 border border-green-500/40 text-green-200 text-xs hover:bg-green-500/30 disabled:opacity-50"
                      >
                        approve
                      </button>
                      <button
                        onClick={() => review(p.id, "rejected")}
                        disabled={busyId === p.id}
                        className="px-3 py-1 rounded bg-red-500/15 border border-red-500/40 text-red-200 text-xs hover:bg-red-500/25 disabled:opacity-50"
                      >
                        reject
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            </>
          )}
        </section>
      )}

      {/* People */}
      {tab === "people" && (
        <section className="mt-5 space-y-6">
          {/* Add — email only. They fill in their name during onboarding. */}
          <div className="rounded-xl border border-white/10 bg-panel/40 p-3 space-y-3">
            <form onSubmit={addParticipant} className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-muted">add one email</label>
                <input
                  required
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="someone@example.com"
                  className="w-full mt-0.5 rounded bg-bg border border-white/10 px-2.5 py-1.5 text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <button type="submit" className="px-3 py-1.5 rounded bg-accent text-black text-sm font-semibold">
                add
              </button>
            </form>

            <details className="text-xs">
              <summary className="cursor-pointer text-muted hover:text-ink">
                paste a list (comma, space, or newline separated)
              </summary>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const t = (e.currentTarget.elements.namedItem("bulk") as HTMLTextAreaElement)?.value ?? "";
                  addMany(t);
                  (e.currentTarget.elements.namedItem("bulk") as HTMLTextAreaElement).value = "";
                }}
                className="mt-2 flex gap-2 flex-col"
              >
                <textarea
                  name="bulk"
                  rows={3}
                  placeholder="a@x.com, b@y.com&#10;c@z.com"
                  className="w-full rounded bg-bg border border-white/10 px-2.5 py-1.5 text-sm focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="self-end px-3 py-1 rounded bg-accent/15 border border-accent/40 text-accent text-xs font-semibold"
                >
                  bulk add
                </button>
              </form>
            </details>
          </div>

          {/* Table */}
          <ul className="rounded-xl border border-white/10 bg-panel/40 divide-y divide-white/5 overflow-hidden">
            {participants.map((p) => (
              <li key={p.email} className="p-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[180px]">
                  <div className="text-sm text-ink flex items-center gap-2">
                    {p.full_name || p.email.split("@")[0]}
                    {p.is_admin && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 border border-violet-400/40 text-violet-200">
                        admin
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted">{p.email}</div>
                  <div className="text-[10px] text-muted/80 mt-0.5">
                    {p.platform ?? "?"} · gpu:{" "}
                    {p.has_gpu === true ? "yes" : p.has_gpu === false ? "no" : "?"} ·{" "}
                    {p.last_sign_in_at ? "signed in" : "never signed in"}
                  </div>
                </div>
                <div className="flex flex-col text-xs gap-0.5">
                  {([1, 2] as const).map((ph) => {
                    const st = ph === 1 ? p.phase1_status : p.phase2_status;
                    const id = `${p.email}-p${ph}`;
                    return (
                      <span key={ph} className="flex items-center gap-1.5">
                        <span className={STATUS_COLOR[st ?? ""] ?? "text-muted"}>
                          p{ph}: {st ?? "—"}
                        </span>
                        <button
                          onClick={() => forcePhase(p.email, ph, st)}
                          disabled={busyId === id}
                          title={
                            st === "approved"
                              ? `reset phase ${ph}`
                              : `force-approve phase ${ph} (no submission needed)`
                          }
                          className={`px-1 rounded border text-[10px] leading-4 disabled:opacity-50 ${
                            st === "approved"
                              ? "border-white/10 text-muted hover:border-red-400/50 hover:text-red-300"
                              : "border-green-500/30 text-green-300 hover:bg-green-500/10"
                          }`}
                        >
                          {busyId === id ? "…" : st === "approved" ? "↺" : "✓"}
                        </button>
                      </span>
                    );
                  })}
                </div>
                <div className="text-xs">
                  {p.submission_title ? (
                    <span className="text-accent">submitted</span>
                  ) : (
                    <span className="text-muted">no submission</span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => toggleAdmin(p.email, p.is_admin)}
                    className="px-2 py-1 rounded border border-white/10 text-xs hover:border-violet-400/60"
                    title="toggle admin"
                  >
                    {p.is_admin ? "unadmin" : "make admin"}
                  </button>
                  <button
                    onClick={() => removeParticipant(p.email)}
                    className="px-2 py-1 rounded border border-red-500/30 text-red-300 text-xs hover:bg-red-500/10"
                  >
                    remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
