import "katex/dist/katex.min.css";
import Link from "next/link";
import { Callout } from "@/components/Callout";
import { Eq } from "@/components/Eq";
import { isWorkshopOpen, workshopStartAtIso } from "@/lib/lock";
import LockedScreen from "@/components/LockedScreen";
import { supabaseServer } from "@/lib/supabase/server";
import { isAdmin as checkIsAdmin } from "@/lib/admin";

export const metadata = { title: "Black holes · Simathon" };

// ponytail: pure content page. No db, no auth gate. The download is a static file in /public.
// Drop the demo zip at: workshop-site/public/sim/simathon-blackhole-demo.zip
const DEMO_HREF = "/sim/simathon-blackhole-demo.zip";

export default async function BlackHolePage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user ? await checkIsAdmin(supabase, user.email) : false;
  if (!isWorkshopOpen() && !isAdmin) {
    return <LockedScreen startsAtIso={workshopStartAtIso()} title="The demo unlocks when the workshop starts." blurb="I'll show my black hole sim live in the meeting. This page (with the physics explainer and download) opens when the workshop begins." />;
  }
  return (
    <div className="prose-body max-w-3xl mx-auto">
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">the demo</div>
      <h1 className="text-3xl font-bold mt-1">The math behind the black hole</h1>
      <p className="text-ink/85 mt-2 text-[15px]">
        At the live event you'll watch a black hole simulation running on a real GPU, then build your
        own. This page is the physics underneath every pixel — the actual equations the demo integrates,
        not hand-waving. Everything here is a non-rotating (Schwarzschild) black hole. In geometric units
        we set <Eq>{String.raw`G = c = 1`}</Eq>, so a mass <Eq>{String.raw`M`}</Eq> has a length: its
        horizon.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3 not-prose">
        <a
          href={DEMO_HREF}
          download
          className="px-4 py-2 rounded-md bg-accent text-black font-semibold text-sm"
        >
          download the demo (Windows) ↓
        </a>
        <span className="text-xs text-muted">
          ~unzip → run <code className="text-ink/85">BlackHoleSimulation.exe</code>. Keep the{" "}
          <code className="text-ink/85">shaders/</code> folder next to it.
        </span>
      </div>

      <h2>Start from the metric</h2>
      <p>
        A black hole isn't a force — it's geometry. All of it falls out of one line element, the{" "}
        <strong>Schwarzschild solution</strong> to Einstein's field equations for the vacuum around a
        spherical mass:
      </p>
      <Eq display>
        {String.raw`ds^2 = -\left(1 - \frac{r_s}{r}\right)c^2\,dt^2 + \left(1 - \frac{r_s}{r}\right)^{-1} dr^2 + r^2\left(d\theta^2 + \sin^2\!\theta\, d\varphi^2\right)`}
      </Eq>
      <p>
        Every feature below is this one object read at a different radius. The single scale in it is the{" "}
        <strong>Schwarzschild radius</strong>, where the <Eq>{String.raw`dt^2`}</Eq> coefficient hits
        zero:
      </p>
      <Eq display>{String.raw`r_s = \frac{2GM}{c^2}`}</Eq>
      <p>
        Sun-mass → 3 km. Earth-mass → 9 mm. Sagittarius A* → ~12 million km. Everything from here is
        measured in units of <Eq>{String.raw`r_s`}</Eq>.
      </p>

      <h2>The five things on screen</h2>

      <h3>1. The event horizon — <Eq>{String.raw`r = r_s`}</Eq></h3>
      <p>
        The dark sphere. Surface where escape velocity equals <Eq>{String.raw`c`}</Eq>. Set{" "}
        <Eq>{String.raw`\tfrac12 v^2 = GM/r`}</Eq> with <Eq>{String.raw`v = c`}</Eq> and you recover{" "}
        <Eq>{String.raw`r_s`}</Eq> exactly — a Newtonian coincidence that happens to give the right
        answer. It's not a wall; it's the radius where every future-pointing path leads inward.
      </p>

      <h3>2. The photon sphere — <Eq>{String.raw`r = \tfrac{3}{2}\,r_s`}</Eq></h3>
      <p>
        Light bends around a null geodesic. Reduced to the orbital plane, a photon's path obeys
      </p>
      <Eq display>
        {String.raw`\left(\frac{du}{d\varphi}\right)^2 = \frac{1}{b^2} - u^2\left(1 - r_s\,u\right), \qquad u \equiv \frac{1}{r}`}
      </Eq>
      <p>
        where <Eq>{String.raw`b`}</Eq> is the impact parameter. Circular photon orbits require{" "}
        <Eq>{String.raw`du/d\varphi = 0`}</Eq> and <Eq>{String.raw`d^2u/d\varphi^2 = 0`}</Eq>, which
        solve to
      </p>
      <Eq display>{String.raw`r_{\text{ph}} = \frac{3GM}{c^2} = \tfrac{3}{2}\,r_s`}</Eq>
      <p>
        Light aimed inside the critical impact parameter <Eq>{String.raw`b_{\text{crit}} = \tfrac{3\sqrt3}{2}\,r_s \approx 2.6\,r_s`}</Eq>{" "}
        falls in — that's why the black shadow looks bigger than the horizon. That number is the width of
        the dark disk in the Event Horizon Telescope image.
      </p>

      <h3>3. The accretion disk — cut off at <Eq>{String.raw`r = 3\,r_s`}</Eq></h3>
      <p>
        For a massive particle the radial motion has an effective potential. The first two terms are pure
        Newton; the third is the GR correction that changes everything:
      </p>
      <Eq display>
        {String.raw`V_{\text{eff}}(r) = -\frac{GMm}{r} + \frac{L^2}{2mr^2} - \frac{GM\,L^2}{c^2\,m\,r^3}`}
      </Eq>
      <p>
        That <Eq>{String.raw`-1/r^3`}</Eq> term means the potential no longer has a stable minimum for
        small <Eq>{String.raw`r`}</Eq>. Below the <strong>innermost stable circular orbit</strong> there
        are no stable orbits at all — matter spirals in:
      </p>
      <Eq display>{String.raw`r_{\text{ISCO}} = \frac{6GM}{c^2} = 3\,r_s`}</Eq>
      <p>
        Outside the ISCO, disk particles ride circular <strong>Keplerian</strong> orbits:
      </p>
      <Eq display>{String.raw`v(r) = \sqrt{\frac{GM}{r}}, \qquad \Omega(r) = \sqrt{\frac{GM}{r^3}}`}</Eq>
      <p>
        Friction heats the gas; a thin disk radiates as a local blackbody with the Shakura–Sunyaev
        profile — hot and blue at the inner edge, cool and red outside:
      </p>
      <Eq display>
        {String.raw`T(r) \propto \left(\frac{\dot{M}}{r^3}\right)^{1/4}\left(1 - \sqrt{\frac{r_{\text{in}}}{r}}\right)^{1/4}`}
      </Eq>
      <p>
        We render ~200k particles on these orbits, colored by <Eq>{String.raw`T(r)`}</Eq>.
      </p>

      <h3>4. Why one side is brighter — Doppler + redshift</h3>
      <p>
        The disk spins. The side rotating toward you is beamed brighter by the relativistic Doppler
        factor; the whole thing is dimmed climbing out of the well. Observed intensity scales as
      </p>
      <Eq display>
        {String.raw`\frac{I_{\text{obs}}}{I_{\text{emit}}} = \delta^{\,4}, \qquad \delta = \frac{1}{\gamma\left(1 - \beta\cos\theta\right)}`}
      </Eq>
      <p>
        and light climbing out is gravitationally redshifted by
      </p>
      <Eq display>{String.raw`1 + z = \left(1 - \frac{r_s}{r}\right)^{-1/2}`}</Eq>
      <p>
        At the horizon <Eq>{String.raw`z \to \infty`}</Eq> — infalling light fades to black rather than
        vanishing at a hard edge.
      </p>

      <h3>5. The lensing — bending starlight</h3>
      <p>
        Far from the hole, a light ray passing at impact parameter <Eq>{String.raw`b`}</Eq> is deflected
        by
      </p>
      <Eq display>{String.raw`\alpha = \frac{4GM}{c^2 b} = \frac{2\,r_s}{b}`}</Eq>
      <p>
        That factor of 4 (twice the Newtonian prediction) is exactly what Eddington measured in 1919. A
        star directly behind the hole smears into an <strong>Einstein ring</strong>. In the demo, the
        lensing fragment shader integrates the photon equation from §2 per pixel and samples the sky
        texture at the deflected angle.
      </p>

      <h2>The equation the demo actually integrates</h2>
      <p>
        Everything cinematic — lensing, the photon ring, the shadow edge — is one ODE. Photons follow
        null geodesics of the metric:
      </p>
      <Eq display>
        {String.raw`\frac{d^2 x^\mu}{d\lambda^2} + \Gamma^{\mu}_{\;\nu\rho}\,\frac{dx^\nu}{d\lambda}\,\frac{dx^\rho}{d\lambda} = 0`}
      </Eq>
      <p>
        The <Eq>{String.raw`\Gamma^{\mu}_{\;\nu\rho}`}</Eq> (Christoffel symbols) come straight from the
        Schwarzschild metric and are textbook. For a static spherical hole you reduce it to the 2D{" "}
        <Eq>{String.raw`u(\varphi)`}</Eq> equation above and march it with RK4 — two ODEs per ray. That's
        the whole "real GR" part. No Einstein Toolkit required.
      </p>

      <Callout title="The honest version">
        The demo's <em>particles</em> use Newtonian gravity with a hard cutoff at{" "}
        <Eq>{String.raw`r_s`}</Eq> — visually correct and physically meaningful. The{" "}
        <em>light</em> (lensing, photon ring) uses the real null geodesics above, because that's the
        part your eye can tell is fake. Both layers are honest about what they are.
      </Callout>

      <h2>What's in <em>your</em> sim: Newtonian is fine</h2>
      <p>
        Using the workshop master prompt with a cosmic idea, you're building a Newtonian sim:
      </p>
      <Eq display>{String.raw`\vec{F} = -\frac{G\,m_1 m_2}{r^2}\,\hat{r}`}</Eq>
      <p>
        This was "wrong" for a century — it missed Mercury's orbit by 43 arcseconds per century, which
        Einstein fixed in 1915. But compare the GR effective potential to Newton: the correction is the{" "}
        <Eq>{String.raw`r_s/r`}</Eq> term, and outside <Eq>{String.raw`\sim 10\,r_s`}</Eq> it's a
        percent-level nudge. So a Newtonian black hole sim is honest if you:
      </p>
      <ul>
        <li>Use inverse-square gravity; set a hole radius <Eq>{String.raw`r_s`}</Eq>; absorb + respawn anything that crosses it.</li>
        <li>Don't allow stable orbits inside <Eq>{String.raw`3\,r_s`}</Eq> (the ISCO).</li>
        <li>Color by speed or potential — hot blue inside, cool red outside. Real disks do exactly that.</li>
      </ul>
      <p>
        Add lensing and the photon ring as <em>shader passes</em> on top. They're graphics-level effects
        riding on top of Newtonian particles — which is exactly what the demo does.
      </p>

      <Callout kind="check" title="Want to go full GR?">
        Integrate the geodesic equation on the Schwarzschild metric, parametrized by affine parameter{" "}
        <Eq>{String.raw`\lambda`}</Eq>. Reduce to the orbital plane, get two ODEs in{" "}
        <Eq>{String.raw`(r, \varphi)`}</Eq>, solve with RK4. A weekend project, not a workshop. GRChombo
        and the Einstein Toolkit are the real numerical-relativity packages — overkill for visualization.
      </Callout>

      <h2>What to do with this</h2>
      <ul>
        <li>
          <strong>Watch the demo run.</strong> The disk warping behind the hole is the lensing ODE. The
          bright ring just outside the shadow is the photon sphere at <Eq>{String.raw`1.5\,r_s`}</Eq>.
        </li>
        <li>
          <strong>Reproduce one feature.</strong> Easiest: the Keplerian disk with an ISCO cutoff.
          Hardest: lensing.
        </li>
        <li>
          <strong>Don't copy the demo's code.</strong> It's C++/OpenGL because that's what I had time
          for. Your Python + Taichi version can be prettier in a fraction of the lines.
        </li>
      </ul>

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
