import { Callout } from "@/components/Callout";
import Link from "next/link";

export const metadata = { title: "Hackathon · Rules + Prizes" };

export default function HackathonPage() {
  return (
    <div className="prose-body max-w-3xl mx-auto">
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">the hackathon</div>
      <h1 className="text-4xl font-extrabold mt-1">One week. One sim. Make it impossible.</h1>
      <p className="text-ink/85 mt-3 text-lg">
        You leave the workshop with a black hole. Now make something nobody else has thought of. You have seven days.
      </p>

      {/* Theme */}
      <h2>Theme</h2>
      <Callout>
        <strong>Build a physics simulation that should not be a physics simulation.</strong>
        <div className="mt-2 text-sm text-ink/85">
          Real physics, fake premise. A galaxy that rains. A black hole inside a goldfish bowl. A double pendulum made of
          planets. A wormhole drinking the Milky Way. The math has to be real. The vision has to be yours.
        </div>
      </Callout>

      <p>Stay in scope:</p>
      <ul>
        <li>Python + Taichi (what you learned). Other Python libs allowed if you justify them.</li>
        <li>Your code, your sim. Copilot/Claude/ChatGPT are fully allowed — that's the whole point. Just don't submit
          someone else's repo as-is.</li>
        <li>It has to <em>run</em>. We will run it on judging day.</li>
      </ul>

      {/* Timeline */}
      <h2>Timeline</h2>
      <ol>
        <li><strong>Workshop Sunday</strong> · 2 hours · we build the black hole together.</li>
        <li><strong>Monday → Saturday</strong> · build week. The chat is live the whole time.</li>
        <li><strong>Submission deadline</strong> · Saturday 11:59 PM IST.</li>
        <li><strong>Judging Sunday</strong> · 2 hours · everyone screen-shares their sim. Judges + peer vote. Top 3 announced.</li>
      </ol>
      <p className="text-sm text-muted">Exact dates confirmed by email after registration closes.</p>

      {/* Judging */}
      <h2>Judging</h2>
      <p>Three things only. Each scored 1–10. Highest total wins.</p>
      <div className="grid sm:grid-cols-3 gap-3 not-prose">
        {[
          { t: "Visual impact", d: "Does it make us go 'whoa'? Glow, motion, color, density — beauty beats correctness." },
          { t: "Creativity", d: "How far from 'a black hole' did you push it? An angle nobody else thought of beats a polished copy." },
          { t: "Complexity", d: "What's actually happening under the hood? Two interacting systems beat one fancy one." },
        ].map((x) => (
          <div key={x.t} className="rounded-xl border border-white/10 bg-panel/60 p-4">
            <div className="text-accent font-semibold">{x.t}</div>
            <div className="text-sm text-ink/85 mt-1">{x.d}</div>
          </div>
        ))}
      </div>

      <h3>Who judges</h3>
      <ul>
        <li>Armaan (workshop lead).</li>
        <li>One or two guest judges from Yuvika's network (TBA).</li>
        <li>Audience vote (each participant votes for their top 2; cannot vote for themselves). 30% weight.</li>
      </ul>

      {/* Prizes */}
      <h2>Prizes</h2>
      <p>
        60% of total registration fees go to the prize pool. Split across the top 3:
      </p>
      <ul>
        <li>🥇 <strong>1st</strong> — 50% of pool</li>
        <li>🥈 <strong>2nd</strong> — 30% of pool</li>
        <li>🥉 <strong>3rd</strong> — 20% of pool</li>
      </ul>
      <p className="text-sm text-muted">Paid via UPI within 7 days of judging.</p>

      <Callout title="Bonus">
        The most original sim, regardless of placement, gets folded into the public <strong>physicssim</strong> project as
        a featured demo, with your name on it.
      </Callout>

      {/* Rules */}
      <h2>Rules</h2>
      <ul>
        <li>One submission per person.</li>
        <li>You can edit your submission until the deadline.</li>
        <li>Code must be on GitHub (we'll teach you how if you don't know — it's 5 minutes).</li>
        <li>Include a <code>README.md</code> with: what your sim does + how to run it (one command if possible).</li>
        <li>Include a screenshot or short clip — judges look at this first.</li>
        <li>Plagiarism (copying someone else's hackathon submission verbatim) = disqualified, no refund.</li>
        <li>Using AI = encouraged. Saying "this is all my code" when it isn't = disqualified.</li>
      </ul>

      {/* What to submit */}
      <h2>What you submit</h2>
      <p>On the <Link href="/submit" className="text-accent">submission page</Link>, you'll provide:</p>
      <ul>
        <li><strong>Title</strong> — one phrase, give it a name.</li>
        <li><strong>Tagline</strong> — one sentence pitch.</li>
        <li><strong>Description</strong> — 100–300 words. What is it, how does it work, what makes it cool.</li>
        <li><strong>GitHub link</strong> — your repo.</li>
        <li><strong>Video URL</strong> — a 30–60 second screen-record. Upload to YouTube (unlisted is fine) or Loom.</li>
        <li><strong>Screenshot URL</strong> — direct image link (Imgur works great).</li>
      </ul>

      <Callout kind="warn" title="If you've never used GitHub">
        Don't panic. We'll do a short walkthrough at the start of the build week — or you can ask in chat. Worst case:
        zip your folder and drop it on Google Drive, submit the Drive link. Don't let the tools block you.
      </Callout>

      <div className="mt-10 flex gap-3 flex-wrap">
        <Link href="/submit" className="px-5 py-2.5 rounded-md bg-accent text-black font-semibold">Go to submission →</Link>
        <Link href="/gallery" className="px-5 py-2.5 rounded-md bg-white/10 hover:bg-white/15 font-semibold">See who's submitted</Link>
      </div>
    </div>
  );
}
