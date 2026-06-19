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
}: {
  participants: ParticipantRow[];
  pending: PendingRow[];
}) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>(pending.length ? "reviews" : "people");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

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

  async function addParticipant(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const { error } = await supabase.rpc("admin_add_participant", {
      p_email: addEmail.trim().toLowerCase(),
      p_name: addName.trim() || addEmail.split("@")[0],
    });
    if (error) setMsg(error.message);
    else {
      setAddEmail("");
      setAddName("");
      setMsg(`added ${addEmail}`);
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
          )}
        </section>
      )}

      {/* People */}
      {tab === "people" && (
        <section className="mt-5 space-y-6">
          {/* Add */}
          <form onSubmit={addParticipant} className="rounded-xl border border-white/10 bg-panel/40 p-3 flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-muted">email</label>
              <input
                required
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="someone@example.com"
                className="w-full mt-0.5 rounded bg-bg border border-white/10 px-2.5 py-1.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="text-xs text-muted">name (optional)</label>
              <input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Name"
                className="w-full mt-0.5 rounded bg-bg border border-white/10 px-2.5 py-1.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <button type="submit" className="px-3 py-1.5 rounded bg-accent text-black text-sm font-semibold">
              add participant
            </button>
          </form>

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
                <div className="flex flex-col text-xs">
                  <span className={STATUS_COLOR[p.phase1_status ?? ""] ?? "text-muted"}>
                    p1: {p.phase1_status ?? "—"}
                  </span>
                  <span className={STATUS_COLOR[p.phase2_status ?? ""] ?? "text-muted"}>
                    p2: {p.phase2_status ?? "—"}
                  </span>
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
