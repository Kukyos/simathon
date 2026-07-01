import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { isAdmin as checkIsAdmin } from "@/lib/admin";
import { isWorkshopOpen, workshopStartAtIso } from "@/lib/lock";
import LockedScreen from "@/components/LockedScreen";
import AutoRefresh from "@/components/AutoRefresh";

export const metadata = { title: "Participants · Simathon" };

type Row = {
  email: string;
  full_name: string | null;
  last_sign_in_at: string | null;
  submission_id: string | null;
  submission_title: string | null;
  submission_tagline: string | null;
  submission_screenshot: string | null;
  submission_status: "pending" | "approved" | "rejected" | null;
};

function timeAgo(iso: string | null) {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

export default async function ParticipantsPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/participants");
  const isAdmin = await checkIsAdmin(supabase, user.email);

  if (!isWorkshopOpen() && !isAdmin) {
    return <LockedScreen startsAtIso={workshopStartAtIso()} title="Participants opens when the workshop starts." blurb="You'll see who else is here once we begin." />;
  }

  const { data, error } = await supabase.rpc("get_participants");
  const rows: Row[] = (data as Row[]) ?? [];

  const total = rows.length;
  const signedIn = rows.filter((r) => r.last_sign_in_at).length;
  const submitted = rows.filter((r) => r.submission_id).length;

  return (
    <div>
      <AutoRefresh ms={15000} />
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">community</div>
      <div className="flex items-baseline gap-3 mt-1 flex-wrap">
        <h1 className="text-3xl font-bold">Participants</h1>
        <span className="text-xs text-muted">refreshes every 15s</span>
      </div>
      <p className="text-ink/80 mt-2 text-sm">
        Everyone registered for the workshop. The green dot means they've signed in at least once. The card on the
        right means they've submitted a sim — click to view.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        {[
          { l: "registered", v: total },
          { l: "signed in", v: signedIn },
          { l: "submitted", v: submitted },
        ].map((s) => (
          <div key={s.l} className="rounded-lg border border-white/10 bg-panel/40 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted">{s.l}</div>
            <div className="text-2xl font-bold text-ink mt-0.5">{s.v}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <ul className="mt-6 rounded-xl border border-white/10 bg-panel/30 divide-y divide-white/5 overflow-hidden">
        {rows.length === 0 && !error && (
          <li className="p-4 text-sm text-muted">No participants registered yet.</li>
        )}
        {error && (
          <li className="p-4 text-sm text-red-400">
            Couldn't load participants. Make sure <code>get_participants()</code> from
            <code> 002_participants.sql </code> has been run in Supabase.
          </li>
        )}
        {rows.map((r) => (
          <li key={r.email} className="p-3 flex items-center gap-3">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                r.last_sign_in_at ? "bg-green-400" : "bg-white/15"
              }`}
              title={r.last_sign_in_at ? "signed in" : "not signed in yet"}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-ink truncate">
                {r.full_name || r.email.split("@")[0]}
              </div>
              <div className="text-xs text-muted truncate">{r.email}</div>
            </div>
            <div className="text-xs text-muted hidden sm:block">{timeAgo(r.last_sign_in_at)}</div>
            {r.submission_id && r.submission_status === "approved" ? (
              <Link
                href={`/gallery/${r.submission_id}`}
                className="ml-2 px-2.5 py-1 rounded-md bg-accent/15 border border-accent/30 text-accent text-xs font-medium hover:bg-accent/25"
              >
                {r.submission_title}
              </Link>
            ) : r.submission_id && r.submission_status === "pending" ? (
              isAdmin ? (
                <Link
                  href={`/gallery/${r.submission_id}`}
                  className="ml-2 px-2.5 py-1 rounded-md border border-yellow-500/40 bg-yellow-500/10 text-yellow-300 text-xs hover:bg-yellow-500/20"
                  title="review pending submission"
                >
                  pending →
                </Link>
              ) : (
                <span
                  className="ml-2 px-2.5 py-1 rounded-md border border-yellow-500/40 text-yellow-300 text-xs"
                  title="awaiting admin review"
                >
                  pending
                </span>
              )
            ) : r.submission_id && r.submission_status === "rejected" ? (
              isAdmin ? (
                <Link
                  href={`/gallery/${r.submission_id}`}
                  className="ml-2 px-2.5 py-1 rounded-md border border-red-500/40 bg-red-500/10 text-red-300 text-xs hover:bg-red-500/20"
                  title="rejected — review again"
                >
                  rejected →
                </Link>
              ) : (
                <span
                  className="ml-2 px-2.5 py-1 rounded-md border border-red-500/40 text-red-300 text-xs"
                  title="rejected by admin"
                >
                  rejected
                </span>
              )
            ) : (
              <span className="ml-2 px-2.5 py-1 rounded-md border border-white/10 text-muted text-xs">
                not yet
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
