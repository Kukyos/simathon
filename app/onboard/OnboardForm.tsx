"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

const PLATFORMS = [
  { v: "windows", label: "Windows", icon: "⊞" },
  { v: "mac", label: "macOS", icon: "" },
  { v: "linux", label: "Linux", icon: "🐧" },
] as const;

const GPU = [
  { v: "yes", label: "Yes — I have a NVIDIA / dedicated GPU" },
  { v: "no", label: "No — just integrated graphics" },
  { v: "dunno", label: "I have no idea what a GPU is" },
] as const;

export default function OnboardForm({
  userEmail,
  next,
}: {
  userEmail: string;
  next: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<string>("windows");
  const [gpu, setGpu] = useState<string>("dunno");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await supabaseBrowser().rpc("upsert_my_profile", {
      p_full_name: name.trim(),
      p_platform: platform,
      p_has_gpu: gpu === "yes" ? true : gpu === "no" ? false : null,
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="mt-6 space-y-6">
      <div>
        <label className="text-sm font-semibold text-ink">Your name</label>
        <div className="text-xs text-muted mb-1.5">First name is fine.</div>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="w-full rounded-md bg-panel border border-white/10 px-3 py-2 focus:outline-none focus:border-accent text-ink"
          placeholder="e.g. Anika"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-ink">Your laptop</label>
        <div className="text-xs text-muted mb-2">Pick the one you'll use for the workshop.</div>
        <div className="grid grid-cols-3 gap-2">
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
      </div>

      <div>
        <label className="text-sm font-semibold text-ink">Got a graphics card?</label>
        <div className="text-xs text-muted mb-2">
          Just helps us know if your sim will run at 60 FPS or 5 FPS.
        </div>
        <div className="space-y-2">
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
      </div>

      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="w-full px-4 py-2.5 rounded-md bg-accent text-black font-semibold disabled:opacity-50"
      >
        {busy ? "saving…" : "let's go →"}
      </button>
      {err && <div className="callout warn text-sm">{err}</div>}
    </form>
  );
}
