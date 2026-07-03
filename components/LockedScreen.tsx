"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function fmt(ms: number) {
  if (ms <= 0) return "opening now…";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (d || h) parts.push(`${h}h`);
  if (d || h || m) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return parts.join(" ");
}

export default function LockedScreen({
  startsAtIso,
  title = "Locked until the workshop starts.",
  blurb = "This part opens when the workshop begins. Until then, finish your setup — that's the only thing you need to be ready.",
}: {
  startsAtIso: string | null;
  title?: string;
  blurb?: string;
}) {
  const startsAt = startsAtIso ? new Date(startsAtIso).getTime() : null;
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = startsAt ? startsAt - now : null;
  const when = startsAtIso ? new Date(startsAtIso) : null;

  return (
    <div className="max-w-2xl">
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">locked</div>
      <h1 className="text-3xl font-bold mt-1">{title}</h1>
      <p className="text-ink/80 mt-2 text-[15px]">{blurb}</p>

      <div className="mt-6 rounded-xl border border-white/10 bg-panel/40 p-4">
        <div className="text-[10px] uppercase tracking-wider text-muted">unlocks in</div>
        <div className="text-3xl font-bold mt-1 font-mono">
          {remaining === null ? "—" : fmt(remaining)}
        </div>
        {when && (
          <div className="text-xs text-muted mt-2">
            {when.toLocaleString("en-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Kolkata",
            })}{" "}
            IST
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/setup"
          className="px-4 py-2 rounded-md bg-accent text-black font-bold text-sm shadow-[0_0_24px_-4px_rgba(255,106,61,0.7)]"
        >
          go to setup →
        </Link>
        <Link href="/hackathon" className="btn-ghost">
          read the hackathon rules
        </Link>
      </div>
    </div>
  );
}
