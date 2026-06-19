"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Existing = {
  id: string;
  status: string;
  proof_url: string | null;
  caption: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  pending: "border-yellow-500/40 bg-yellow-500/10 text-yellow-200",
  approved: "border-green-500/40 bg-green-500/10 text-green-200",
  rejected: "border-red-500/40 bg-red-500/10 text-red-200",
};

export default function PhaseForm({
  phase,
  userEmail,
  existing,
}: {
  phase: number;
  userEmail: string;
  existing: Existing | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState(existing?.caption ?? "");
  const [preview, setPreview] = useState<string | null>(existing?.proof_url ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function pickFile(f: File | null) {
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const supabase = supabaseBrowser();

    let proofUrl = existing?.proof_url ?? null;

    if (file) {
      const ext = file.name.split(".").pop() || "png";
      const path = `${userEmail}/phase${phase}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("phase_proofs")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) {
        setBusy(false);
        setErr(`upload failed: ${upErr.message}`);
        return;
      }
      const { data } = supabase.storage.from("phase_proofs").getPublicUrl(path);
      proofUrl = data.publicUrl;
    }

    if (!proofUrl) {
      setBusy(false);
      setErr("attach a screenshot first");
      return;
    }

    // Re-submitting always resets to pending so admins re-review.
    const { error: dbErr } = await supabase.from("phase_progress").upsert(
      {
        user_email: userEmail,
        phase,
        proof_url: proofUrl,
        caption: caption.trim() || null,
        status: "pending",
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        reviewed_by: null,
      },
      { onConflict: "user_email,phase" },
    );

    setBusy(false);
    if (dbErr) {
      setErr(dbErr.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {existing && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            STATUS_STYLE[existing.status] ?? "border-white/10 text-ink/80"
          }`}
        >
          status: <strong>{existing.status}</strong>
          {existing.status === "pending" && " — waiting on an admin to look at it."}
          {existing.status === "approved" && " — you're good. move on."}
          {existing.status === "rejected" && " — re-submit with what the admin asked for."}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-ink">Screenshot / clip</label>
          <div className="text-xs text-muted mb-1.5">
            PNG, JPG, or short MP4. Max ~10 MB.
          </div>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="proof preview"
              className="w-full max-h-64 object-contain rounded-md border border-white/10 bg-black/40 mb-2"
            />
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/mp4"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-ink/80
              file:mr-3 file:py-2 file:px-3
              file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-accent file:text-black
              file:cursor-pointer
              hover:file:opacity-90"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">Note (optional)</label>
          <div className="text-xs text-muted mb-1.5">
            Anything you want the admin to know — e.g. "had to use CPU, no GPU."
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            className="w-full rounded-md bg-panel border border-white/10 px-3 py-2 focus:outline-none focus:border-accent text-ink text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-md bg-accent text-black font-semibold disabled:opacity-50"
        >
          {busy ? "uploading…" : existing ? "re-submit" : "submit for review"}
        </button>
        {err && <div className="callout warn text-sm">{err}</div>}
      </form>
    </div>
  );
}
