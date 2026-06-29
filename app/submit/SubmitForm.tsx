"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Submission = {
  id?: string;
  title: string;
  tagline: string;
  description: string;
  video_url: string | null;       // YouTube or Google Drive share link
  github_url: string | null;      // public GitHub repo link
  screenshot_url: string | null;  // public URL of the uploaded screenshot
  display_name: string | null;
};

const empty: Submission = {
  title: "",
  tagline: "",
  description: "",
  video_url: "",
  github_url: "",
  screenshot_url: "",
  display_name: "",
};

// ponytail: cheap client-side sanity check. Real validation is the admin clicking the link.
function looksLikeUrl(s: string) {
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

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

  const folder = userEmail.replace(/[^a-z0-9._-]/gi, "_");

  async function uploadScreenshot(file: File) {
    if (file.size > 5_000_000) {
      setMsg({ kind: "err", text: "Screenshot must be under 5 MB. Try a JPG export." });
      return;
    }
    setProgress("uploading screenshot…");
    const supabase = supabaseBrowser();
    const ext = file.name.split(".").pop() || "png";
    const path = `${folder}/screenshot.${ext}`;
    const { error } = await supabase.storage
      .from("submissions")
      .upload(path, file, { upsert: true, contentType: file.type || undefined });
    if (error) {
      setProgress("");
      setMsg({ kind: "err", text: error.message });
      return;
    }
    const { data } = supabase.storage.from("submissions").getPublicUrl(path);
    setForm((f) => ({ ...f, screenshot_url: data.publicUrl }));
    setProgress("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    if (!looksLikeUrl(form.video_url || "")) {
      setMsg({ kind: "err", text: "Video link doesn't look like a URL." });
      return;
    }
    if (!looksLikeUrl(form.github_url || "")) {
      setMsg({ kind: "err", text: "GitHub link doesn't look like a URL." });
      return;
    }

    setSaving(true);
    setMsg(null);

    const payload = {
      user_email: userEmail,
      display_name: form.display_name?.trim() || null,
      title: form.title.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      github_url: (form.github_url || "").trim() || null,
      video_url: (form.video_url || "").trim() || null,
      screenshot_url: form.screenshot_url || null,
      files: [],
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
        label="Video link *"
        hint='YouTube Unlisted is recommended (Drive throttles videos with many views). Or Google Drive set to "Anyone with the link". Paste the share URL.'
      >
        <input
          required
          type="url"
          value={form.video_url ?? ""}
          onChange={set("video_url")}
          className={input}
          placeholder="https://youtu.be/... or https://drive.google.com/file/d/..."
        />
      </Field>

      <Field
        label="GitHub repo link *"
        hint='Push your code folder to a PUBLIC GitHub repo and paste the link. Private repos won&apos;t open.'
      >
        <input
          required
          type="url"
          value={form.github_url ?? ""}
          onChange={set("github_url")}
          className={input}
          placeholder="https://github.com/yourname/your-sim"
        />
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
