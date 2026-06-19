"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import Stepper, { Step } from "@/components/Stepper";

const PLATFORMS = [
  { v: "windows", label: "Windows", icon: "⊞" },
  { v: "mac",     label: "macOS",   icon: "" },
  { v: "linux",   label: "Linux",   icon: "🐧" },
] as const;

const GPU = [
  { v: "yes",   label: "Yes — NVIDIA / dedicated GPU" },
  { v: "no",    label: "No — integrated graphics only" },
  { v: "dunno", label: "No idea what a GPU is" },
] as const;

export default function OnboardForm({
  userEmail,
  next,
}: {
  userEmail: string;
  next: string;
}) {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<string>("windows");
  const [gpu, setGpu] = useState<string>("dunno");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setBusy(true);
    setErr("");
    const supabase = supabaseBrowser();
    const has_gpu = gpu === "yes" ? true : gpu === "no" ? false : null;
    const fullName = name.trim();

    let { error } = await supabase.from("profiles").upsert(
      { user_email: userEmail, full_name: fullName, platform, has_gpu },
      { onConflict: "user_email" },
    );

    if (error) {
      console.warn("[onboard] direct upsert failed, trying RPC:", error.message);
      const r = await supabase.rpc("upsert_my_profile", {
        p_full_name: fullName,
        p_platform: platform,
        p_has_gpu: has_gpu,
      });
      error = r.error;
    }

    setBusy(false);

    if (error) {
      setErr(`Couldn't save: ${error.message}. Tell organizers to re-run migrations 003 / 005.`);
      console.error("[onboard] both paths failed:", error);
      return;
    }

    window.location.href = next;
  }

  return (
    <Stepper
      initialStep={1}
      onFinalStepCompleted={save}
      backButtonText="back"
      nextButtonText="next"
      nextButtonProps={{ disabled: busy || (name.trim().length === 0) }}
    >
      <Step>
        <div className="text-xs uppercase tracking-[0.2em] text-accent2">welcome</div>
        <h2 className="text-2xl font-bold mt-1 text-ink">You're in.</h2>
        <p className="text-ink/70 mt-2 text-sm leading-relaxed">
          Three quick questions before you start. Helps us help you when something breaks.
        </p>
        <p className="text-ink/50 mt-3 text-xs">Takes about 20 seconds.</p>
      </Step>

      <Step>
        <div className="text-xs uppercase tracking-[0.18em] text-muted">01 / your name</div>
        <h2 className="text-xl font-semibold mt-1 text-ink">What do we call you?</h2>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Anika"
          className="w-full mt-4 rounded-md bg-bg/60 border border-white/10 px-3 py-2.5 focus:outline-none focus:border-accent text-ink"
        />
        <p className="text-xs text-muted mt-2">First name is fine.</p>
      </Step>

      <Step>
        <div className="text-xs uppercase tracking-[0.18em] text-muted">02 / your laptop</div>
        <h2 className="text-xl font-semibold mt-1 text-ink">What are you running?</h2>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {PLATFORMS.map((p) => (
            <button
              key={p.v}
              type="button"
              onClick={() => setPlatform(p.v)}
              className={`rounded-md border px-3 py-3 text-sm flex flex-col items-center gap-1 transition ${
                platform === p.v
                  ? "border-accent bg-accent/10 text-ink"
                  : "border-white/10 text-ink/75 hover:border-white/30"
              }`}
            >
              <span className="text-lg">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>
      </Step>

      <Step>
        <div className="text-xs uppercase tracking-[0.18em] text-muted">03 / your gpu</div>
        <h2 className="text-xl font-semibold mt-1 text-ink">Got a graphics card?</h2>
        <p className="text-xs text-muted mt-1">60 FPS or 5 FPS — that's the difference.</p>
        <div className="space-y-2 mt-4">
          {GPU.map((g) => (
            <button
              key={g.v}
              type="button"
              onClick={() => setGpu(g.v)}
              className={`w-full text-left rounded-md border px-3 py-2.5 text-sm transition ${
                gpu === g.v
                  ? "border-accent bg-accent/10 text-ink"
                  : "border-white/10 text-ink/75 hover:border-white/30"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
        {err && (
          <div className="mt-4 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {err}
          </div>
        )}
        {busy && (
          <div className="mt-4 text-xs text-muted">saving…</div>
        )}
      </Step>
    </Stepper>
  );
}
