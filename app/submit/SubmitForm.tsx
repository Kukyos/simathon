"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Submission = {
  id?: string;
  title: string;
  tagline: string;
  description: string;
  github_url: string | null;
  video_url: string | null;
  screenshot_url: string | null;
  display_name: string | null;
};

const empty: Submission = {
  title: "",
  tagline: "",
  description: "",
  github_url: "",
  video_url: "",
  screenshot_url: "",
  display_name: "",
};

export default function SubmitForm({ initial, userEmail }: { initial: Submission | null; userEmail: string }) {
  const [form, setForm] = useState<Submission>(initial ?? empty);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const router = useRouter();

  const set = (k: keyof Submission) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

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
      github_url: form.github_url?.trim() || null,
      video_url: form.video_url?.trim() || null,
      screenshot_url: form.screenshot_url?.trim() || null,
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
    <form onSubmit={save} className="space-y-4 mt-6 not-prose">
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

      <Field label="GitHub URL" hint="Your repo. Public.">
        <input value={form.github_url ?? ""} onChange={set("github_url")} className={input} placeholder="https://github.com/you/your-sim" />
      </Field>

      <Field label="Video URL" hint="30–60s screen recording. YouTube unlisted or Loom.">
        <input value={form.video_url ?? ""} onChange={set("video_url")} className={input} placeholder="https://youtu.be/..." />
      </Field>

      <Field label="Screenshot URL" hint="Direct image link. Imgur works great.">
        <input value={form.screenshot_url ?? ""} onChange={set("screenshot_url")} className={input} placeholder="https://i.imgur.com/..." />
      </Field>

      <div className="flex gap-3 items-center">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-md bg-accent text-black font-semibold disabled:opacity-50"
        >
          {saving ? "Saving..." : initial ? "Update submission" : "Submit"}
        </button>
        {msg && (
          <span className={msg.kind === "ok" ? "text-green-400 text-sm" : "text-red-400 text-sm"}>{msg.text}</span>
        )}
      </div>
    </form>
  );
}

const input =
  "w-full rounded-md bg-panel border border-white/10 px-3 py-2 focus:outline-none focus:border-accent text-ink";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm font-semibold text-ink">{label}</div>
      {hint && <div className="text-xs text-muted mb-1">{hint}</div>}
      {children}
    </label>
  );
}
