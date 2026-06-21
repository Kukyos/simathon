import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Submission · Simathon" };

function toEmbed(url: string | null): { kind: "youtube" | "loom" | "raw"; src: string } | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      if (id) return { kind: "youtube", src: `https://www.youtube.com/embed/${id}` };
    }
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v") || u.pathname.split("/").pop();
      if (id) return { kind: "youtube", src: `https://www.youtube.com/embed/${id}` };
    }
    if (host.endsWith("loom.com")) {
      const id = u.pathname.split("/").pop();
      if (id) return { kind: "loom", src: `https://www.loom.com/embed/${id}` };
    }
    if (/\.(mp4|webm|mov)$/i.test(u.pathname)) {
      return { kind: "raw", src: url };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export default async function SubmissionPage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/gallery/${params.id}`);

  const { data: s } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!s) notFound();

  const embed = toEmbed(s.video_url);
  const author = s.display_name || (s.user_email as string).split("@")[0];

  return (
    <div>
      <div className="text-xs">
        <Link href="/gallery" className="text-muted hover:text-accent">
          ← all submissions
        </Link>
      </div>

      <div className="mt-4 text-xs uppercase tracking-[0.2em] text-accent2">submission</div>
      <h1 className="text-3xl font-bold mt-1">{s.title}</h1>
      <p className="text-ink/85 mt-2 text-[15px]">{s.tagline}</p>
      <div className="text-xs text-muted mt-2">by {author}</div>

      {/* Media: clip first (uploaded mp4 or external embed), then screenshot below */}
      {embed && (
        <div className="mt-6 rounded-xl overflow-hidden border border-white/10 bg-black aspect-video">
          {embed.kind === "raw" ? (
            <video src={embed.src} controls className="w-full h-full" />
          ) : (
            <iframe
              src={embed.src}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          )}
        </div>
      )}
      {s.screenshot_url && (
        <div className="mt-4 rounded-xl overflow-hidden border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.screenshot_url} alt={s.title} className="w-full" />
        </div>
      )}

      {/* Description */}
      <section className="mt-8">
        <h2 className="text-sm uppercase tracking-[0.18em] text-muted mb-2">about</h2>
        <div className="text-ink/90 text-[15px] whitespace-pre-wrap leading-relaxed">
          {s.description}
        </div>
      </section>

      {/* Code files */}
      {Array.isArray(s.files) && s.files.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm uppercase tracking-[0.18em] text-muted mb-2">code</h2>
          <ul className="rounded-lg border border-white/10 bg-panel/40 divide-y divide-white/5 text-sm">
            {(s.files as Array<{ name: string; path: string; size: number }>).map((f) => (
              <li key={f.name} className="flex items-center gap-3 px-3 py-2">
                <span className="font-mono truncate flex-1">{f.name}</span>
                <span className="text-xs text-muted">{(f.size / 1024).toFixed(1)} KB</span>
                <a href={f.path} target="_blank" rel="noreferrer" className="text-accent text-xs">
                  download
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 text-xs text-muted">
        Submitted {new Date(s.created_at).toLocaleString()}
        {s.updated_at && s.updated_at !== s.created_at && (
          <> · last edited {new Date(s.updated_at).toLocaleString()}</>
        )}
      </div>
    </div>
  );
}
