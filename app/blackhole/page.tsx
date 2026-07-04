import "katex/dist/katex.min.css";
import Link from "next/link";
import { Callout } from "@/components/Callout";
import { Eq } from "@/components/Eq";
import { isWorkshopOpen, workshopStartAtIso } from "@/lib/lock";
import LockedScreen from "@/components/LockedScreen";
import { supabaseServer } from "@/lib/supabase/server";
import { isAdmin as checkIsAdmin } from "@/lib/admin";

export const metadata = { title: "Black holes · Simathon" };

// The zip is built from /kerr_raytracer at the repo root:
//   Compress-Archive kerr_raytracer/* -> workshop-site/public/sim/simathon-blackhole-demo.zip
const DEMO_HREF = "/sim/simathon-blackhole-demo.zip";

function RayDiagram() {
  return (
    <div className="not-prose my-6 rounded-xl border border-white/10 bg-black/30 p-4">
      <svg viewBox="0 0 720 330" className="w-full h-auto" role="img" aria-label="Diagram: light rays traced backwards from the camera bend around the black hole">
        {/* stars */}
        <circle cx="60" cy="40" r="1.5" fill="#cdd6ff" />
        <circle cx="130" cy="90" r="1" fill="#cdd6ff" />
        <circle cx="40" cy="180" r="1" fill="#cdd6ff" />
        <circle cx="90" cy="280" r="1.5" fill="#cdd6ff" />
        <circle cx="200" cy="30" r="1" fill="#cdd6ff" />
        <circle cx="30" cy="110" r="1.2" fill="#ffd9b0" />
        {/* accretion disk (edge-on line through the hole) */}
        <line x1="120" y1="165" x2="285" y2="165" stroke="#ff9a4d" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
        <line x1="435" y1="165" x2="560" y2="165" stroke="#b34700" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
        {/* black hole */}
        <circle cx="360" cy="165" r="58" fill="#000" stroke="#7c5cff" strokeOpacity="0.6" strokeWidth="2" />
        <text x="360" y="170" textAnchor="middle" fill="#8b8fa3" fontSize="12">black hole</text>
        {/* camera */}
        <rect x="655" y="150" width="30" height="30" rx="4" fill="none" stroke="#e8e8f0" strokeWidth="2" />
        <circle cx="670" cy="165" r="6" fill="none" stroke="#e8e8f0" strokeWidth="2" />
        <text x="670" y="205" textAnchor="middle" fill="#8b8fa3" fontSize="12">camera</text>
        {/* ray 1: misses wide, barely bends, ends at a star */}
        <path d="M 655 155 Q 420 60 80 45" fill="none" stroke="#cdd6ff" strokeWidth="1.5" strokeDasharray="6 5" opacity="0.85" />
        <text x="150" y="65" fill="#cdd6ff" fontSize="12">barely bends → shows a star</text>
        {/* ray 2: passes close, bends hard, hits the disk BEHIND the hole */}
        <path d="M 655 160 Q 430 110 360 95 Q 300 85 250 140 Q 230 160 240 163" fill="none" stroke="#ff9a4d" strokeWidth="1.5" strokeDasharray="6 5" opacity="0.95" />
        <text x="380" y="70" fill="#ff9a4d" fontSize="12">bends over the top → shows the disk behind the hole</text>
        {/* ray 3: too close, spirals in */}
        <path d="M 655 172 Q 480 195 430 185 Q 395 178 385 168" fill="none" stroke="#ff5c5c" strokeWidth="1.5" strokeDasharray="6 5" opacity="0.9" />
        <text x="465" y="225" fill="#ff5c5c" fontSize="12">gets too close → falls in → black pixel</text>
      </svg>
      <div className="text-xs text-muted mt-2">
        One ray per pixel, fired backwards from the camera. Where the ray ends up decides the pixel's color.
        The window is about a million pixels, so: a million of these, every frame.
      </div>
    </div>
  );
}

export default async function BlackHolePage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user ? await checkIsAdmin(supabase, user.email) : false;
  if (!isWorkshopOpen() && !isAdmin) {
    return <LockedScreen startsAtIso={workshopStartAtIso()} title="The demo unlocks when the workshop starts." blurb="I'll show my black hole ray tracer live in the meeting. This page (with the physics walkthrough and download) opens when the workshop begins." />;
  }
  return (
    <div className="prose-body max-w-3xl mx-auto">
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">the demo</div>
      <h1 className="text-3xl font-bold mt-1">The black hole demo, explained like a human</h1>
      <p className="text-ink/85 mt-2 text-[15px]">
        This page explains what the demo actually does, in plain words. There is real physics here,
        but you don't need any of it to build your own sim today. Read it for the ideas and the
        vocabulary. The few formulas that appear are guests, not the hosts.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3 not-prose">
        <a
          href={DEMO_HREF}
          download
          className="px-4 py-2 rounded-md bg-accent text-black font-semibold text-sm"
        >
          download the demo (Python, any OS) ↓
        </a>
        <span className="text-xs text-muted">
          unzip, then double-click <code className="text-ink/85">run.bat</code> (Windows) or run{" "}
          <code className="text-ink/85">sh run.sh</code> (Mac). It finds or fetches a compatible
          Python for you. GPU recommended.
        </span>
      </div>

      <h2>1 · The one idea everything hangs on</h2>
      <p>
        Newton said gravity is a force: things pull on each other. Einstein said no: mass{" "}
        <strong>bends space and time</strong> around itself, and everything (including light) just
        travels in the straightest possible line through that bent space. The classic picture is a
        bowling ball on a trampoline. A marble rolling past doesn't get "pulled", it follows the
        dip in the surface.
      </p>
      <p>
        A black hole is the extreme case: so much mass in so little space that close to it, the
        bending is total. There's a point of no return, the <strong>event horizon</strong>. Light
        that crosses it doesn't come back, which is the entire reason the thing looks black.
      </p>
      <p>
        In 1916, Karl Schwarzschild solved Einstein's equations for a <em>non-spinning</em> black
        hole, while serving in World War I. It took until <strong>1963</strong> for Roy Kerr to
        crack the <em>spinning</em> version. Real black holes all spin, so the spinning solution,
        the <strong>Kerr metric</strong>, is the equation for the real thing, and it's what this
        demo computes. That's the whole reason for the name.
      </p>

      <h2>2 · How the picture gets made: ray tracing, backwards</h2>
      <p>
        My old sims moved particles around and drew a dark circle in the middle. This demo draws
        nothing by hand. Instead, for <strong>every single pixel</strong> of the window, it fires a
        ray of light <em>backwards</em>: out of the camera, into space. Einstein's equations bend
        the ray as it travels. Then the pixel simply shows whatever its ray ended up hitting:
      </p>
      <RayDiagram />
      <p>
        Why backwards? Because a star sprays light in every direction and almost none of it enters
        your camera. Tracing forwards wastes almost every ray. Tracing backwards from the camera
        means every ray you compute is one that matters. Every serious renderer works this way,
        including the ones at Pixar; the only difference here is that gravity gets a vote on where
        each ray goes.
      </p>
      <p>
        Bending the ray is done by solving a small set of differential equations, step by step,
        with a standard numerical method (called RK4; up to ~400 tiny steps per ray). That
        phrase, <strong>"solving equations step by step because there's no shortcut formula"</strong>,
        is basically the definition of a simulation. Your sim today will do the same thing, just
        with simpler equations.
      </p>

      <h2>3 · What you're actually seeing on screen</h2>
      <p>
        Here's the part I find genuinely insane: nobody drew ANY of the features you see. They all
        emerge from the light-bending math on their own.
      </p>
      <ul>
        <li>
          <strong>The black circle ("the shadow").</strong> Pixels whose rays fell in. The math
          makes it about 2.6 times wider than the horizon itself, and that's exactly the size of
          the dark patch in the real Event Horizon Telescope photos from 2019.
        </li>
        <li>
          <strong>The thin bright ring hugging the shadow.</strong> Light that did a full lap (or
          two, or three) around the black hole before escaping to the camera. Photons doing orbits.
        </li>
        <li>
          <strong>The glow arcing over the top ("the Interstellar look").</strong> That's the{" "}
          <em>back</em> half of the disk, which is physically behind the hole. Its light bends up
          and over the top, so you see behind the black hole. Same math the Interstellar VFX team
          used.
        </li>
        <li>
          <strong>One side of the disk is brighter.</strong> The gas orbits at a decent fraction of
          the speed of light. The side racing toward you gets brightness-boosted (this is called{" "}
          <strong>relativistic beaming</strong>), the side racing away gets dimmed. The real
          telescope images have the same lopsided glow.
        </li>
        <li>
          <strong>The colors.</strong> No artist picked that orange. The gas gets hotter closer in
          (friction), and each ring glows with the actual color a thing at that temperature glows,
          like iron in a forge going red, then orange, then white. Physicists call that{" "}
          <strong>blackbody color</strong>.
        </li>
        <li>
          <strong>Drag the spin slider and the shadow goes D-shaped.</strong> A spinning black hole
          drags space itself around with it, like a spoon spinning in honey. This is{" "}
          <strong>frame dragging</strong>, and it's the signature difference between Schwarzschild
          and Kerr. The slider also moves the disk's inner edge: closer to the hole the faster it
          spins, another straight prediction of the math.
        </li>
      </ul>

      <Callout kind="check" title="Verify it, don't trust it">
        Run <code>python kerr_blackhole.py --check</code>. It fires test rays and compares the
        results against exact numbers physicists have worked out on paper (the shadow size, the
        innermost stable orbit, the spin asymmetry). If the physics were faked, these tests could
        not pass. Demand this of your own sims: every real simulation has some known answer it can
        be checked against.
      </Callout>

      <h2>4 · A taste of the actual math (optional, skippable)</h2>
      <p>
        You can close this section and lose nothing. But if you want to see what "real physics in
        the code" literally looks like, here are the two numbers doing the most work.
      </p>
      <p>
        <strong>Where the horizon is.</strong> The spin of the hole is a number{" "}
        <Eq>{String.raw`a`}</Eq> between 0 (not spinning) and 1 (spinning as fast as physics
        allows). The point of no return sits at
      </p>
      <Eq display>{String.raw`r_+ = 1 + \sqrt{1 - a^2}`}</Eq>
      <p>
        Read it out loud: for a non-spinning hole (<Eq>{String.raw`a=0`}</Eq>) the horizon radius
        is 2 units; spin it up to the max (<Eq>{String.raw`a=1`}</Eq>) and the horizon shrinks to
        1. One tiny formula, and it's wired straight to the demo's spin slider.
      </p>
      <p>
        <strong>The color-and-brightness number.</strong> When a ray hits the disk, the code
        computes one number <Eq>{String.raw`g`}</Eq>: the ratio of the photon's energy when it{" "}
        <em>reaches you</em> to its energy when it <em>left the gas</em>. Climbing out of the
        gravity well drains the photon (gravitational redshift), and the gas rushing toward or away
        from you shifts it again (the Doppler effect, same reason an ambulance siren changes pitch
        as it passes). Both effects collapse into that single <Eq>{String.raw`g`}</Eq>. Then:
        brightness gets multiplied by <Eq>{String.raw`g^4`}</Eq>, and color shifts by{" "}
        <Eq>{String.raw`g`}</Eq>. That one number is carrying all of Einstein on its back, and it's
        maybe six lines of Python.
      </p>

      <Callout title="The honest version">
        What's deliberately simplified in the demo: the disk is infinitely thin, its turbulence is
        a noise texture rather than real fluid dynamics, and the background stars aren't
        redshifted. Everything about <em>where light goes and what color it arrives</em> is exact.
        Knowing precisely which parts of your sim are real and which are decoration is the
        difference between simulating and decorating. Say it in your README and nobody can touch
        you.
      </Callout>

      <h2>5 · Where each idea lives in the code</h2>
      <p>The demo is one Python file, about 500 lines. The physics is maybe 80 of them:</p>
      <div className="not-prose my-4 overflow-x-auto rounded-md border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-panel/70 text-left text-ink/90">
              <th className="px-3 py-2 font-semibold">The idea</th>
              <th className="px-3 py-2 font-semibold">Function in <code>kerr_blackhole.py</code></th>
            </tr>
          </thead>
          <tbody className="text-ink/80">
            <tr className="border-t border-white/10"><td className="px-3 py-2">How curved space bends each ray (Kerr, 1963)</td><td className="px-3 py-2"><code>geodesic_rhs</code></td></tr>
            <tr className="border-t border-white/10"><td className="px-3 py-2">Stepping the ray forward, ~400 small steps</td><td className="px-3 py-2"><code>rk4_step</code></td></tr>
            <tr className="border-t border-white/10"><td className="px-3 py-2">Turning a pixel into a ray direction</td><td className="px-3 py-2"><code>camera_ray</code></td></tr>
            <tr className="border-t border-white/10"><td className="px-3 py-2">Where the disk's inner edge sits (moves with spin)</td><td className="px-3 py-2"><code>isco_radius</code></td></tr>
            <tr className="border-t border-white/10"><td className="px-3 py-2">The g number: redshift + Doppler + beaming</td><td className="px-3 py-2"><code>shade_disk</code></td></tr>
            <tr className="border-t border-white/10"><td className="px-3 py-2">How hot the gas is at each radius</td><td className="px-3 py-2"><code>disk_temperature</code></td></tr>
            <tr className="border-t border-white/10"><td className="px-3 py-2">Temperature → glow color</td><td className="px-3 py-2"><code>blackbody_rgb</code></td></tr>
            <tr className="border-t border-white/10"><td className="px-3 py-2">The self-tests</td><td className="px-3 py-2"><code>run_checks</code> (run with <code>--check</code>)</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        There's also a <code>SHOW_physics.py</code> in the download: the physics core copied onto
        one screen with plain-English comments, for reading.
      </p>

      <h2>6 · Your ladder: what to build yourself</h2>
      <p>
        You do NOT need any of the above for the hackathon. Black hole sims come in levels, every
        level is legitimate, and honesty about your level beats faking a higher one:
      </p>
      <ul>
        <li>
          <strong>Level 1: Newton.</strong> Particles pulled by the school formula{" "}
          <Eq>{String.raw`F = GMm/r^2`}</Eq>, a capture radius where they vanish, color by speed.
          Far from the hole, Newton is within a percent of Einstein, so say that in your README and
          your sim is honest. This is what the workshop master prompt builds, and it can look{" "}
          <em>great</em>.
        </li>
        <li>
          <strong>Level 2: bend some light.</strong> One famous equation bends light rays around a
          non-spinning hole in 2D. Ask your AI: "add gravitational lensing using the real geodesic
          equation for a Schwarzschild black hole, and explain the equation to me before you code
          it." Real lensing, about 20 lines.
        </li>
        <li>
          <strong>Level 3: what the demo does.</strong> Full spinning-black-hole ray tracing. The
          recipe is this page, and the annotated code is in the download.
        </li>
      </ul>

      <Callout kind="warn" title="The actual point of the demo">
        Anyone can prompt an AI into "a black hole simulation." The difference between decorative
        and real is knowing <em>which ideas</em> must be inside (bent light paths, the g number)
        and <em>how to check</em> they're really being computed (the self-tests, the known
        numbers). Specifying and verifying: that's the skill that makes you dangerous with AI tools
        instead of dependent on them.
      </Callout>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/workshop" className="px-4 py-2 rounded-md bg-accent text-black font-semibold text-sm">
          back to the workshop →
        </Link>
        <Link href="/workshop#ideas" className="btn-ghost">
          see all sim ideas
        </Link>
      </div>
    </div>
  );
}
