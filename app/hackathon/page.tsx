import { Callout } from "@/components/Callout";
import Link from "next/link";

export const metadata = { title: "Hackathon · Simathon" };

export default function HackathonPage() {
  return (
    <div className="prose-body max-w-3xl mx-auto">
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">03 · the hackathon</div>
      <h1 className="text-3xl font-bold mt-1">Hackathon rules</h1>
      <p className="text-ink/80 mt-2 text-[15px]">
        The workshop hands you the tools. The hackathon is what you do with them. One evening to learn it,
        a week to build, one deadline. Everything you need is below.
      </p>

      {/* Theme */}
      <h2>Theme</h2>
      <Callout>
        <strong>Real physics. Cinematic visuals. Your own idea.</strong>
        <div className="mt-2 text-sm text-ink/85">
          Pick something from the{" "}
          <Link href="/workshop#ideas" className="text-accent">
            idea gallery
          </Link>{" "}
          or invent your own. The math has to be real. The look has to be yours. Beyond that — go crazy.
        </div>
      </Callout>

      {/* Timeline */}
      <h2>Timeline</h2>
      <ul>
        <li>
          <strong>Workshop day</strong> · Sunday, July 5, 6 PM IST · we cover the tools and the prompt together.
        </li>
        <li>
          <strong>Build week</strong> · July 6–12 · you build your sim. Chat is live the whole time.
        </li>
        <li>
          <strong>Submission deadline</strong> · Sunday, July 12, 11:59 PM IST.
        </li>
        <li>
          <strong>Results</strong> · winners announced on the group WhatsApp, and posted here on the site the
          next day. No live call, no screen-sharing — your video does the talking.
        </li>
      </ul>

      {/* Judging */}
      <h2>Judging</h2>
      <p>Three criteria, equally weighted:</p>
      <div className="grid sm:grid-cols-3 gap-3 not-prose">
        {[
          {
            t: "Visual impact",
            d: "Does it make us go 'whoa'? Density, glow, motion, color. Beauty matters.",
          },
          {
            t: "Creativity",
            d: "An angle nobody else thought of beats a polished copy of someone else's idea.",
          },
          {
            t: "Physics accuracy",
            d: "Real formulas, sensible constants, and honesty about what you approximated. A physicist watching it should nod, not wince.",
          },
        ].map((x) => (
          <div key={x.t} className="rounded-xl border border-white/10 bg-panel/60 p-4">
            <div className="text-accent font-semibold text-sm">{x.t}</div>
            <div className="text-xs text-ink/80 mt-1.5 leading-relaxed">{x.d}</div>
          </div>
        ))}
      </div>
      <p className="text-sm text-ink/70 mt-3">
        Not sure what "real physics" looks like in practice? The{" "}
        <Link href="/blackhole" className="text-accent">demo's physics page</Link> shows exactly
        where a sim can be exact, where it can approximate, and how to check the difference.
      </p>

      {/* Prizes */}
      <h2>Prizes</h2>
      <p>
        <strong>Medals and certificates</strong> for the top submissions. Everyone who submits gets a
        participation certificate.
      </p>

      <Callout title="Beyond the medal">
        Standout sims will be featured (with your name and credit) in the public{" "}
        <strong>physicssim</strong> project, which teaches physics visually to school students. Your work could end up
        in a classroom.
      </Callout>

      {/* Rules */}
      <h2>Rules</h2>
      <ul>
        <li>One submission per person.</li>
        <li>You can edit your submission anytime until the deadline.</li>
        <li>Code on GitHub, public. Drive link is fine if you don't have GitHub yet.</li>
        <li>
          Include a one-line README with: what the sim shows + how to run it (e.g. <code>python sim.py</code>).
        </li>
        <li>Include a short clip or screenshot. Judges look at this first.</li>
        <li>Using AI to write the code is encouraged. It's the whole workflow.</li>
        <li>Submitting someone else's hackathon work as your own = disqualified.</li>
      </ul>

      {/* Submit */}
      <h2>What you submit</h2>
      <p>
        On the{" "}
        <Link href="/submit" className="text-accent">
          submit page
        </Link>{" "}
        you'll provide:
      </p>
      <ul>
        <li>
          <strong>Title</strong> — one phrase, give it a name.
        </li>
        <li>
          <strong>Tagline</strong> — one-sentence pitch.
        </li>
        <li>
          <strong>Description</strong> — what it is, how it works.
        </li>
        <li>
          <strong>Repo link</strong> — GitHub or a Drive folder.
        </li>
        <li>
          <strong>Video URL</strong> — 30–60s screen recording. YouTube unlisted or Loom.
        </li>
        <li>
          <strong>Screenshot URL</strong> — direct image link. Imgur works.
        </li>
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/submit" className="px-4 py-2 rounded-md bg-accent text-black font-semibold text-sm">
          go to submission →
        </Link>
        <Link href="/gallery" className="btn-ghost">
          see who's submitted
        </Link>
      </div>
    </div>
  );
}
