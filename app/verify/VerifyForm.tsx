"use client";

import { useEffect, useState } from "react";
import certs from "./certs.json";

const RECORDS: Record<string, { name: string; project: string }> = certs;
const DATES = "July 05, 2026 – July 12, 2026";

function normalize(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function VerifyForm() {
  const [id, setId] = useState("");
  const [checked, setChecked] = useState(false);

  // Deep link from the certificate email: /verify?id=FPY02007.
  // Read off window rather than useSearchParams so this needs no Suspense boundary.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("id");
    if (q) {
      setId(q);
      setChecked(true);
    }
  }, []);

  const record = checked ? RECORDS[normalize(id)] : undefined;

  return (
    <div className="mt-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setChecked(true);
        }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <input
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setChecked(false);
          }}
          placeholder="FPY02001"
          aria-label="Certificate ID"
          spellCheck={false}
          className="flex-1 rounded-lg border border-white/15 bg-panel px-4 py-3 font-mono text-ink
                     placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button type="submit" className="bg-accent text-black rounded-lg px-6 py-3">
          Verify
        </button>
      </form>

      {checked && record && (
        <div className="mt-6 rounded-xl border border-accent/40 bg-panel p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Valid certificate</div>
          <div className="mt-3 text-2xl font-bold">{record.name}</div>
          <dl className="mt-4 space-y-2 text-[15px]">
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-muted">Project</dt>
              <dd>{record.project}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-muted">Awarded for</dt>
              <dd>Participation in the Black Hole Simulation Workshop &amp; Hackathon</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-muted">Held</dt>
              <dd>{DATES}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-muted">Issued by</dt>
              <dd>Young Physics &amp; Astrophysics Enthusiasts (YPAE) Club</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-muted">ID</dt>
              <dd className="font-mono">{normalize(id)}</dd>
            </div>
          </dl>
          <p className="mt-5 text-sm text-muted">
            Check that the name above matches the name printed on the certificate. If they differ, the
            certificate is not genuine.
          </p>
        </div>
      )}

      {checked && !record && id.trim() && (
        <div className="mt-6 rounded-xl border border-white/15 bg-panel p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-muted">No match</div>
          <p className="mt-3 text-[15px] text-ink/80">
            No certificate was issued with the ID <span className="font-mono">{normalize(id)}</span>.
            Check for typos — IDs look like <span className="font-mono">FPY02001</span>.
          </p>
        </div>
      )}
    </div>
  );
}
