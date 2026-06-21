"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type FileEntry = { name: string; path: string; size: number };

type Submission = {
  id?: string;
  title: string;
  tagline: string;
  description: string;
  video_url: string | null;       // public URL of the uploaded clip
  screenshot_url: string | null;  // public URL of the uploaded screenshot
  files: FileEntry[];             // list of uploaded code files
  display_name: string | null;
};

const empty: Submission = {
  title: "",
  tagline: "",
  description: "",
  video_url: "",
  screenshot_url: "",
  files: [],
  display_name: "",
};

export default function SubmitForm({
  initial,
  userEmail,
}: {
  initial: Submission | null;
  userEmail: string;
}) {
  const [form, setForm] = useState<Submission>(initial ?? empty);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const router = useRouter();

  const set =
    (k: keyof Submission) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  // ponytail: per-user folder. Reusing the bucket means the old screenshot is overwritten on resubmit.
  const folder = userEmail.replace(/[^a-z0-9._-]/gi, "_");

  async function uploadOne(file: File, subpath: string): Promise<string> {
    const supabase = supabaseBrowser();
    const path = `${folder}/${subpath}`;
    const { error } = await supabase.storage
      .from("submissions")
      .upload(path, file, { upsert: true, contentType: file.type || undefined });
    if (error) throw error;
    const { data } = supabase.storage.from("submissions").getPublicUrl(path);
    return data.publicUrl;
  }

  async function uploadScreenshot(file: File) {
    setProgress("uploading screenshot…");
    const ext = file.name.split(".").pop() || "png";
    const url = await uploadOne(file, `screenshot.${ext}`);
    setForm((f) => ({ ...f, screenshot_url: url }));
    setProgress("");
  }

  async function uploadVideo(file: File) {
    setProgress("uploading clip…");
    const ext = file.name.split(".").pop() || "mp4";
    const url = await uploadOne(file, `clip.${ext}`);
    setForm((f) => ({ ...f, video_url: url }));
    setProgress("");
  }

  async function uploadFolder(fileList: FileList) {
    const files = Array.from(fileList);
    const entries: FileEntry[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      // webkitRelativePath gives "myproject/main.py" etc. Fall back to name.
      const rel: string = f.webkitRelativePath || f.name;
      setProgress(`uploading ${i + 1}/${files.length}: ${rel}`);
      const path = `${folder}/code/${rel}`;
      const supabase = supabaseBrowser();
      const { error } = await supabase.storage
        .from("submissions")
        .upload(path, f, { upsert: true, contentType: f.type || undefined });
      if (error) throw error;
      const { data } = supabase.storage.from("submissions").getPublicUrl(path);
      entries.push({ name: rel, path: data.publicUrl, size: f.size });
    }
    setForm((f) => ({ ...f, files: entries }));
    setProgress("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const payload = {
      user_email: userEmail,
      display_name: form.display_name?.trim() || null,
      title: form.title.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      github_url: null,
      video_url: form.video_url || null,
      screenshot_url: form.screenshot_url || null,
      files: form.files,
      updated_at: new Date().toISOString(),
    };

    const supabase = supabaseBrowser();
    const { error } = await supabase
      .from("submissions")
      .upsert(payload, { onConflict: "user_email" });

    setSaving(false);
    if (error) {
      setMsg({ kind: "err", text: error.message });
    } else {
      setMsg({ kind: "ok", text: "Saved. You can edit again any time before the deadline." });
      router.refresh();
    }
  }

  return (
    <form onSubmit={save} className="space-y-5 mt-6 not-prose">
      <Field label="Display name" hint="What goes on the leaderboard. Default: your email username.">
        <input value={form.display_name ?? ""} onChange={set("display_name")} className={input} placeholder="e.g. Anika R." />
      </Field>

      <Field label="Title *" hint="One phrase. Give your sim a name.">
        <input required value={form.title} onChange={set("title")} className={input} placeholder="Goldfish Bowl Singularity" />
      </Field>

      <Field label="Tagline *" hint="One-sentence pitch.">
        <input required value={form.tagline} onChange={set("tagline")} className={input} placeholder="A black hole the size of a pet, eating goldfish." />
      </Field>

      <Field label="Description *" hint="100–300 words. What is it, how it works, why it's cool.">
        <textarea required rows={6} value={form.description} onChange={set("description")} className={input} />
      </Field>

      <Field
        label="Screenshot *"
        hint="One image. PNG or JPG. Pick the best frame of your sim."
      >
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && uploadScreenshot(e.target.files[0])}
          className={fileInput}
        />
        {form.screenshot_url && (
          <a href={form.screenshot_url} target="_blank" rel="noreferrer" className="block mt-2 text-xs text-accent underline">
            preview uploaded screenshot
          </a>
        )}
      </Field>

      <Field
        label="Clip *"
        hint="30–60 second screen recording. MP4 / MOV / WEBM."
      >
        <input
          type="file"
          accept="video/*"
          onChange={(e) => e.target.files?.[0] && uploadVideo(e.target.files[0])}
          className={fileInput}
        />
        {form.video_url && (
          <video src={form.video_url} controls className="mt-2 w-full max-w-md rounded-md border border-white/10" />
        )}
      </Field>

      <Field
        label="Your code folder *"
        hint="Pick the whole folder. The browser uploads every file inside it — no zipping, no git."
      >
        <input
          type="file"
          // @ts-expect-error: non-standard but supported in Chrome/Edge/Safari/Firefox
          webkitdirectory=""
          directory=""
          multiple
          onChange={(e) => e.target.files && e.target.files.length > 0 && uploadFolder(e.target.files)}
          className={fileInput}
        />
        {form.files.length > 0 && (
          <ul className="mt-2 text-xs text-ink/80 space-y-0.5 max-h-40 overflow-y-auto rounded-md border border-white/10 bg-panel/30 p-2">
            {form.files.map((f) => (
              <li key={f.name} className="font-mono truncate">
                {f.name} <span className="text-muted">({(f.size / 1024).toFixed(1)} KB)</span>
              </li>
            ))}
          </ul>
        )}
      </Field>

      {progress && (
        <div className="text-xs text-accent2">{progress}</div>
      )}

      <div className="flex gap-3 items-center">
        <button
          type="submit"
          disabled={saving || !!progress}
          className="px-5 py-2.5 rounded-md bg-accent text-black font-semibold disabled:opacity-50"
        >
          {saving ? "Saving..." : initial ? "Update submission" : "Submit"}
        </button>
        {msg && (
          <span className={msg.kind === "ok" ? "text-green-400 text-sm" : "text-red-400 text-sm"}>
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}

const input =
  "w-full rounded-md bg-panel border border-white/10 px-3 py-2 focus:outline-none focus:border-accent text-ink";
const fileInput =
  "w-full text-sm text-ink/85 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-accent file:text-black file:font-semibold file:cursor-pointer hover:file:bg-accent/90";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm font-semibold text-ink">{label}</div>
      {hint && <div className="text-xs text-muted mb-1.5">{hint}</div>}
      {children}
    </label>
  );
}
