import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { isAdmin as checkIsAdmin } from "@/lib/admin";
import DetailClient from "./DetailClient";

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
    if (host.endsWith("drive.google.com")) {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      const id = m?.[1] || u.searchParams.get("id");
      if (id) return { kind: "youtube", src: `https://drive.google.com/file/d/${id}/preview` };
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

  const myEmail = user.email!.toLowerCase();
  const isAdmin = await checkIsAdmin(supabase, user.email);

  const { data: s } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!s) notFound();

  const isOwner = (s.user_email as string).toLowerCase() === myEmail;
  const status: "pending" | "approved" | "rejected" = s.gallery_status ?? "approved";

  // Non-admins and non-owners can only see approved submissions.
  if (!isAdmin && !isOwner && status !== "approved") notFound();

  const { data: reactions } = await supabase
    .from("submission_reactions")
    .select("submission_id,user_email,reaction")
    .eq("submission_id", params.id);

  const embed = toEmbed(s.video_url);
  const author = s.display_name || (s.user_email as string).split("@")[0];

  return (
    <div>
      <div className="text-xs">
        <Link href="/gallery" className="text-muted hover:text-accent">
          ← all submissions
        </Link>
      </div>

      {/* Status banners (only for owner or admin) */}
      {(isOwner || isAdmin) && status === "pending" && (
        <div className="mt-4 rounded-md border border-yellow-500/40 bg-yellow-500/5 px-3 py-2 text-sm text-yellow-200">
          Awaiting admin review. Not visible in the gallery yet.
        </div>
      )}
      {(isOwner || isAdmin) && status === "rejected" && (
        <div className="mt-4 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          <div className="font-semibold">Rejected by admin — not in the gallery.</div>
          {s.gallery_note && <div className="mt-1 text-red-100/85">Note: {s.gallery_note}</div>}
          {isOwner && (
            <div className="mt-1 text-red-100/70">
              <Link href="/submit" className="underline">Edit your submission →</Link>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-xs uppercase tracking-[0.2em] text-accent2">submission</div>
      <h1 className="text-3xl font-bold mt-1">{s.title}</h1>
      <p className="text-ink/85 mt-2 text-[15px]">{s.tagline}</p>
      <div className="text-xs text-muted mt-2">by {author}</div>

      <DetailClient
        submissionId={params.id}
        userEmail={myEmail}
        isAdmin={isAdmin}
        initialReactions={(reactions ?? []) as any}
        initialStatus={status}
        initialNote={s.gallery_note ?? null}
      />

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

      <section className="mt-8">
        <h2 className="text-sm uppercase tracking-[0.18em] text-muted mb-2">about</h2>
        <div className="text-ink/90 text-[15px] whitespace-pre-wrap leading-relaxed">
          {s.description}
        </div>
      </section>

      {s.github_url && (
        <section className="mt-8">
          <h2 className="text-sm uppercase tracking-[0.18em] text-muted mb-2">code</h2>
          <a
            href={s.github_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-panel/40 px-3 py-2 text-sm hover:bg-white/5"
          >
            <span className="font-mono truncate">{s.github_url}</span>
            <span className="text-xs text-accent">open ↗</span>
          </a>
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
