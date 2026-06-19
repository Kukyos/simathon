import Link from "next/link";

export default function Home() {
  return (
    <div className="prose-body">
      {/* Hero */}
      <section className="pt-6 pb-14 text-center">
        <div className="inline-block text-xs uppercase tracking-[0.2em] text-accent2 mb-3">
          one day. real physics. cinematic code.
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
          Simulate the <span className="text-accent">impossible</span>.
        </h1>
        <p className="max-w-2xl mx-auto mt-5 text-lg text-ink/85">
          Build your own black hole. A galaxy collision. A particle universe.
          One Sunday. Zero prior coding experience needed.
        </p>
        <div className="mt-7 flex gap-3 justify-center">
          <Link href="/login" className="px-5 py-2.5 rounded-md bg-accent text-black font-semibold hover:opacity-90">
            Get started
          </Link>
          <Link href="/workshop" className="px-5 py-2.5 rounded-md bg-white/10 hover:bg-white/15 font-semibold">
            See what you'll build
          </Link>
        </div>
        <div className="mt-4 text-xs text-muted">
          ₹80 per seat · 60% of fees go to the prize pool · top 3 win
        </div>
      </section>

      {/* The three things */}
      <section className="grid md:grid-cols-3 gap-4 mb-16">
        {[
          {
            t: "1 · Workshop",
            d: "A single 2-hour Sunday session. We install everything, then live-build a black hole from scratch. By the end, you'll have one running on your laptop.",
            href: "/workshop",
          },
          {
            t: "2 · Build week",
            d: "Seven days. Your own simulation. Vibe-code it with GitHub Copilot — we'll show you how. Theme: physics, but cinematic.",
            href: "/hackathon",
          },
          {
            t: "3 · Showcase",
            d: "Demo your sim live. Judges pick top 3 on visual impact, creativity, and how impossibly cool it looks.",
            href: "/hackathon",
          },
        ].map((c) => (
          <Link
            key={c.t}
            href={c.href}
            className="rounded-xl border border-white/10 bg-panel/60 p-5 hover:border-accent/40 hover:bg-panel transition"
          >
            <div className="text-sm text-accent2 font-semibold">{c.t}</div>
            <div className="mt-2 text-ink/90 text-sm leading-relaxed">{c.d}</div>
          </Link>
        ))}
      </section>

      {/* What you'll be able to do */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-3">By Sunday night, you'll have built:</h2>
        <ul className="grid sm:grid-cols-2 gap-2 text-ink/85 list-none p-0">
          {[
            "A particle universe with real gravity",
            "Orbits that look like the photo of M87*",
            "A black hole with an event horizon that eats matter",
            "A photon ring glowing around it",
            "Your own starting point to enter the hackathon",
          ].map((x) => (
            <li key={x} className="flex gap-2 items-start">
              <span className="text-accent mt-0.5">▸</span>
              <span>{x}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Who this is for */}
      <section className="mb-16 grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-panel/40 p-5">
          <h3 className="text-lg font-semibold">This is for you if</h3>
          <ul className="mt-2 text-ink/85 text-sm space-y-1.5">
            <li>▸ You like physics, astronomy, or just want to make pretty things on a screen.</li>
            <li>▸ You've never written a line of code (good — we start at zero).</li>
            <li>▸ You're a physics student who wants to <em>see</em> the equations move.</li>
            <li>▸ You want a portfolio piece that looks like CGI but is real simulation.</li>
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 bg-panel/40 p-5">
          <h3 className="text-lg font-semibold">This is NOT</h3>
          <ul className="mt-2 text-ink/85 text-sm space-y-1.5">
            <li>▸ A Python tutorial. We use AI (GitHub Copilot) to write most of the code.</li>
            <li>▸ A theoretical physics course. We compute, we don't derive.</li>
            <li>▸ Hard. If you can read English and click "next," you'll be fine.</li>
          </ul>
        </div>
      </section>

      {/* Logistics strip */}
      <section className="rounded-xl border border-white/10 bg-panel/60 p-6 mb-12">
        <h2 className="text-2xl font-bold mb-3">Logistics</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><div className="text-muted">Format</div><div className="text-ink">Zoom · recorded</div></div>
          <div><div className="text-muted">Workshop</div><div className="text-ink">Sunday · 2 hours</div></div>
          <div><div className="text-muted">Hackathon</div><div className="text-ink">The week after</div></div>
          <div><div className="text-muted">You need</div><div className="text-ink">Laptop + internet</div></div>
        </div>
        <div className="mt-4 text-xs text-muted">
          Exact date confirmed by email once registration closes. Don't have a GPU? Fine — we'll run on CPU.
        </div>
      </section>

      <section className="text-center mb-6">
        <Link href="/setup" className="text-accent underline">Already registered? Start with the setup guide →</Link>
      </section>
    </div>
  );
}
