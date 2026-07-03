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

export default async function BlackHolePage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user ? await checkIsAdmin(supabase, user.email) : false;
  if (!isWorkshopOpen() && !isAdmin) {
    return <LockedScreen startsAtIso={workshopStartAtIso()} title="The demo unlocks when the workshop starts." blurb="I'll show my black hole ray tracer live in the meeting. This page (with the full physics walkthrough and download) opens when the workshop begins." />;
  }
  return (
    <div className="prose-body max-w-3xl mx-auto">
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">the demo</div>
      <h1 className="text-3xl font-bold mt-1">A real Kerr black-hole ray tracer</h1>
      <p className="text-ink/85 mt-2 text-[15px]">
        The demo is not a particle system with a dark circle drawn in the middle, and it is not a
        post-processing warp filter. It is a <strong>rotating (Kerr) black hole</strong>, and every
        pixel on screen is a photon traced <em>backwards</em> from the camera along an exact null
        geodesic of the Kerr metric, integrated numerically on your GPU. Roughly a million
        geodesics per frame, in ~500 lines of Python. This page derives everything the code does.
        Everything is in geometric units, <Eq>{String.raw`G = c = M = 1`}</Eq>, so radii are
        measured in units of the black hole's mass.
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
          unzip → double-click <code className="text-ink/85">run.bat</code> (Windows) or run{" "}
          <code className="text-ink/85">sh run.sh</code> (Mac). It finds or fetches a compatible
          Python for you. GPU recommended.
        </span>
      </div>

      <Callout kind="check" title="Verify it, don't trust it">
        Run <code>python kerr_blackhole.py --check</code>. It traces test photons and compares
        against exact textbook results: the Schwarzschild critical impact parameter{" "}
        <Eq>{String.raw`3\sqrt3\,M`}</Eq>, Hamiltonian conservation along every ray, ISCO radii,
        and the frame-dragging asymmetry of a spinning hole. If the physics were faked, these
        tests could not pass.
      </Callout>

      <h2>1 · The metric is the whole theory</h2>
      <p>
        General relativity says gravity is not a force — it's the geometry of spacetime, encoded in
        a metric <Eq>{String.raw`g_{\mu\nu}`}</Eq>. For an uncharged spinning mass, the exact
        solution of Einstein's field equations is the <strong>Kerr metric</strong> (1963). In
        Boyer–Lindquist coordinates <Eq>{String.raw`(t, r, \theta, \varphi)`}</Eq>:
      </p>
      <Eq display>
        {String.raw`ds^2 = -\left(1 - \tfrac{2r}{\Sigma}\right)dt^2 - \tfrac{4 a r \sin^2\theta}{\Sigma}\,dt\,d\varphi + \tfrac{\Sigma}{\Delta}dr^2 + \Sigma\, d\theta^2 + \left(r^2 + a^2 + \tfrac{2a^2 r \sin^2\theta}{\Sigma}\right)\sin^2\theta\, d\varphi^2`}
      </Eq>
      <Eq display>
        {String.raw`\Sigma = r^2 + a^2\cos^2\theta, \qquad \Delta = r^2 - 2r + a^2`}
      </Eq>
      <p>
        The single new parameter is the spin <Eq>{String.raw`a = J/M`}</Eq>, between 0 and 1. Set{" "}
        <Eq>{String.raw`a = 0`}</Eq> and this collapses to the Schwarzschild metric — the sim has a
        spin slider, so you can watch that limit happen. The event horizon sits where{" "}
        <Eq>{String.raw`\Delta = 0`}</Eq>:
      </p>
      <Eq display>{String.raw`r_+ = 1 + \sqrt{1 - a^2}`}</Eq>
      <p>
        Note the <Eq>{String.raw`dt\,d\varphi`}</Eq> cross term. That term does not exist for a
        static mass, and it means spacetime itself is <em>dragged around</em> the spinning hole —
        near the horizon you physically cannot stand still. This is frame dragging, and it's why
        the shadow of a fast-spinning hole is D-shaped instead of circular.
      </p>

      <h2>2 · Light rays as Hamiltonian flow</h2>
      <p>
        Photons follow null geodesics. You could write the geodesic equation with Christoffel
        symbols, but there is a cleaner, deeper formulation the demo actually uses: geodesics are
        the trajectories of the <strong>super-Hamiltonian</strong>
      </p>
      <Eq display>{String.raw`\mathcal{H} = \tfrac{1}{2} g^{\mu\nu} p_\mu p_\nu, \qquad \mathcal{H} = 0 \text{ for light}`}</Eq>
      <p>
        Because the metric doesn't depend on <Eq>{String.raw`t`}</Eq> or{" "}
        <Eq>{String.raw`\varphi`}</Eq>, two momenta are conserved along every ray: the energy{" "}
        <Eq>{String.raw`E = -p_t`}</Eq> and the axial angular momentum{" "}
        <Eq>{String.raw`L_z = p_\varphi`}</Eq>. For Kerr the Hamiltonian separates (this is the
        same structure that gives the famous Carter constant):
      </p>
      <Eq display>
        {String.raw`\mathcal{H} = \frac{1}{2\Sigma}\left[\, \Delta p_r^2 + p_\theta^2 - \frac{P(r)^2}{\Delta} + W(\theta)^2 \right]`}
      </Eq>
      <Eq display>
        {String.raw`P(r) = E\,(r^2 + a^2) - a L_z, \qquad W(\theta) = \frac{L_z}{\sin\theta} - a E \sin\theta`}
      </Eq>
      <p>
        Then the equations of motion are just Hamilton's equations — the same ones from classical
        mechanics:
      </p>
      <Eq display>
        {String.raw`\frac{dx^i}{d\lambda} = \frac{\partial \mathcal{H}}{\partial p_i}, \qquad \frac{dp_i}{d\lambda} = -\frac{\partial \mathcal{H}}{\partial x^i}`}
      </Eq>
      <p>
        Five coupled ODEs per photon — <Eq>{String.raw`(r, \theta, \varphi, p_r, p_\theta)`}</Eq> —
        with all derivatives worked out analytically (function <code>geodesic_rhs</code> in the
        code), integrated with classic RK4 (<code>rk4_step</code>) and an adaptive step that
        shrinks near the horizon. Since <Eq>{String.raw`\mathcal{H}`}</Eq> must stay exactly zero
        along a light ray, the code recomputes it as it integrates: it's a built-in error gauge.
        Typical drift is <Eq>{String.raw`\sim 10^{-6}`}</Eq>.
      </p>

      <h2>3 · The camera is an observer, not a matrix</h2>
      <p>
        In GR you can't just aim a view frustum — "direction" is only defined in some observer's
        local frame. The demo's camera is a <strong>ZAMO</strong> (zero-angular-momentum observer):
        the locally non-rotating frame at the camera point. Its orthonormal tetrad{" "}
        <Eq>{String.raw`\{e_{\hat t}, e_{\hat r}, e_{\hat\theta}, e_{\hat\varphi}\}`}</Eq> converts
        each pixel's unit view direction <Eq>{String.raw`\vec n`}</Eq> into a physical photon
        4-momentum:
      </p>
      <Eq display>
        {String.raw`p^\mu = e_{\hat t}^{\;\mu} + n_r\, e_{\hat r}^{\;\mu} + n_\theta\, e_{\hat\theta}^{\;\mu} + n_\varphi\, e_{\hat\varphi}^{\;\mu}`}
      </Eq>
      <p>
        from which <Eq>{String.raw`E`}</Eq>, <Eq>{String.raw`L_z`}</Eq>,{" "}
        <Eq>{String.raw`p_r`}</Eq>, <Eq>{String.raw`p_\theta`}</Eq> follow by lowering indices with
        the metric (<code>camera_ray</code>). A subtle payoff: the ZAMO frame already rotates with
        the dragged spacetime at rate <Eq>{String.raw`\omega = 2ar/A`}</Eq> — the frame dragging is
        in the camera too, because it has to be.
      </p>

      <h2>4 · The accretion disk, done relativistically</h2>
      <h3>Where it ends: the ISCO</h3>
      <p>
        Gas in the disk rides circular orbits, but GR forbids stable circular orbits too close in.
        The <strong>innermost stable circular orbit</strong> depends on spin via Bardeen's 1972
        formula (implemented in <code>isco_radius</code>, wired to the spin slider):
      </p>
      <Eq display>
        {String.raw`r_{\text{ISCO}} = 3 + Z_2 - \sqrt{(3 - Z_1)(3 + Z_1 + 2 Z_2)}`}
      </Eq>
      <Eq display>
        {String.raw`Z_1 = 1 + (1-a^2)^{1/3}\left[(1+a)^{1/3} + (1-a)^{1/3}\right], \qquad Z_2 = \sqrt{3a^2 + Z_1^2}`}
      </Eq>
      <p>
        <Eq>{String.raw`a=0`}</Eq> gives the Schwarzschild answer <Eq>{String.raw`6M`}</Eq>;{" "}
        <Eq>{String.raw`a \to 1`}</Eq> lets the disk plunge all the way to{" "}
        <Eq>{String.raw`1M`}</Eq>. Drag the spin slider and watch the inner edge move — that's a
        real prediction, not a parameter.
      </p>
      <h3>How it moves and glows</h3>
      <p>
        Each ring orbits with the exact Kerr circular-orbit angular velocity{" "}
        <Eq>{String.raw`\Omega = 1/(r^{3/2} + a)`}</Eq>, and shines as a blackbody with the
        Shakura–Sunyaev thin-disk temperature profile (friction converts orbital energy to heat):
      </p>
      <Eq display>
        {String.raw`T(r) \propto r^{-3/4}\left(1 - \sqrt{r_{\text{in}}/r}\right)^{1/4}`}
      </Eq>
      <p>
        peaking around <Eq>{String.raw`8000\,\text{K}`}</Eq> near the inner edge and cooling to dull
        red outside — the colors on screen come from the Planckian locus, not an artist's palette.
      </p>

      <h2>5 · One number carries all the relativity: the redshift factor</h2>
      <p>
        When a traced ray hits the disk, how bright and what color should that pixel be? The photon
        was emitted by gas orbiting at a good fraction of <Eq>{String.raw`c`}</Eq>, deep in a
        gravity well. Everything — gravitational redshift <em>and</em> special-relativistic Doppler
        — collapses into a single exact number, the ratio of observed to emitted photon energy:
      </p>
      <Eq display>
        {String.raw`g \;=\; \frac{E_{\text{obs}}}{E_{\text{em}}} \;=\; \frac{1}{u^t\,(E - \Omega L_z)}, \qquad u^t = \frac{1}{\sqrt{-(g_{tt} + 2\Omega g_{t\varphi} + \Omega^2 g_{\varphi\varphi})}}`}
      </Eq>
      <p>
        Here <Eq>{String.raw`E`}</Eq> and <Eq>{String.raw`L_z`}</Eq> are the photon's conserved
        quantities (already known from the camera step — nothing extra to integrate) and{" "}
        <Eq>{String.raw`u^t`}</Eq> is the disk's orbital 4-velocity. Then two exact transformation
        laws finish the job:
      </p>
      <ul>
        <li>
          <strong>Beaming:</strong> bolometric intensity transforms as{" "}
          <Eq>{String.raw`I_{\text{obs}} = g^4\, I_{\text{em}}`}</Eq> — the side of the disk
          rotating toward you is dramatically brighter. That lopsided glow in the demo (and in the
          real EHT images) is <Eq>{String.raw`g^4`}</Eq>.
        </li>
        <li>
          <strong>Color:</strong> a blackbody at <Eq>{String.raw`T`}</Eq> observed with shift{" "}
          <Eq>{String.raw`g`}</Eq> is still a blackbody, at temperature{" "}
          <Eq>{String.raw`g\,T`}</Eq>. Approaching side: hotter and bluer. Receding side: cooler
          and redder.
        </li>
      </ul>

      <h2>6 · The stuff you get for free</h2>
      <p>
        Because the geodesics are real, the famous phenomena are not features that were programmed
        in — they <em>emerge</em>:
      </p>
      <ul>
        <li>
          <strong>The shadow.</strong> Rays aimed inside the critical impact parameter never come
          back. For <Eq>{String.raw`a=0`}</Eq> that's{" "}
          <Eq>{String.raw`b_{\text{crit}} = 3\sqrt{3}\,M \approx 5.2\,M`}</Eq> — the size of the
          dark patch in the Event Horizon Telescope images of M87* and Sgr A*.
        </li>
        <li>
          <strong>The photon ring.</strong> Light that circles the hole once (or twice, or n
          times) before escaping piles up in a thin bright ring hugging the shadow.
        </li>
        <li>
          <strong>The "Interstellar" band.</strong> The glow arcing <em>over</em> the shadow is the
          far side of the disk, behind the hole — its light is bent up and over the top. The band
          under the shadow is the disk's underside.
        </li>
        <li>
          <strong>Frame dragging.</strong> At <Eq>{String.raw`a=0.95`}</Eq>, a prograde photon at{" "}
          <Eq>{String.raw`b = 3.2\,M`}</Eq> escapes where a non-spinning hole would have swallowed
          it, while retrograde light is captured out to <Eq>{String.raw`\approx 6.9\,M`}</Eq>. The
          shadow flattens on the prograde side into the characteristic "D". (This is one of the{" "}
          <code>--check</code> tests.)
        </li>
        <li>
          <strong>Einstein arcs.</strong> The background starfield smears into arcs around the
          shadow — same lensing Eddington first measured in 1919, just <Eq>{String.raw`10^{10}`}</Eq>{" "}
          times stronger.
        </li>
      </ul>

      <Callout title="The honest version">
        What's deliberately simplified: the disk is infinitely thin and opaque, its turbulence is a
        procedural noise texture (not magnetohydrodynamics), the temperature profile is
        Shakura–Sunyaev rather than the fully relativistic Novikov–Thorne flux, and the starfield
        isn't redshifted. Everything about the <em>geometry and the light transport</em> — the
        geodesics, the ISCO, the redshift factor, the beaming — is exact GR. Knowing precisely
        where your simulation is exact and where it approximates is the difference between
        simulating and decorating.
      </Callout>

      <h2>7 · Equation → code</h2>
      <p>The whole thing is one Python file. Every equation above has an address:</p>
      <div className="not-prose my-4 overflow-x-auto rounded-md border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-panel/70 text-left text-ink/90">
              <th className="px-3 py-2 font-semibold">Physics</th>
              <th className="px-3 py-2 font-semibold">Function in <code>kerr_blackhole.py</code></th>
            </tr>
          </thead>
          <tbody className="text-ink/80">
            <tr className="border-t border-white/10"><td className="px-3 py-2">Kerr Hamiltonian + Hamilton's equations</td><td className="px-3 py-2"><code>geodesic_rhs</code></td></tr>
            <tr className="border-t border-white/10"><td className="px-3 py-2">RK4 integrator</td><td className="px-3 py-2"><code>rk4_step</code></td></tr>
            <tr className="border-t border-white/10"><td className="px-3 py-2">ZAMO tetrad → photon (E, L_z, p)</td><td className="px-3 py-2"><code>camera_ray</code></td></tr>
            <tr className="border-t border-white/10"><td className="px-3 py-2">Bardeen ISCO</td><td className="px-3 py-2"><code>isco_radius</code></td></tr>
            <tr className="border-t border-white/10"><td className="px-3 py-2">Redshift factor g, beaming g⁴, orbit Ω</td><td className="px-3 py-2"><code>shade_disk</code></td></tr>
            <tr className="border-t border-white/10"><td className="px-3 py-2">Shakura–Sunyaev T(r)</td><td className="px-3 py-2"><code>disk_temperature</code></td></tr>
            <tr className="border-t border-white/10"><td className="px-3 py-2">Blackbody → sRGB</td><td className="px-3 py-2"><code>blackbody_rgb</code></td></tr>
            <tr className="border-t border-white/10"><td className="px-3 py-2">Physics self-tests</td><td className="px-3 py-2"><code>run_checks</code> (<code>--check</code>)</td></tr>
          </tbody>
        </table>
      </div>

      <h2>8 · What to build yourself</h2>
      <p>
        You don't need to reproduce all of this in the hackathon. There's an honest ladder, and
        every rung makes a legitimate, beautiful sim:
      </p>
      <ul>
        <li>
          <strong>Level 1 — Newtonian.</strong>{" "}
          <Eq>{String.raw`\vec F = -GMm\,\hat r/r^2`}</Eq> particles, a capture radius at{" "}
          <Eq>{String.raw`r_s = 2M`}</Eq>, no stable orbits inside <Eq>{String.raw`6M`}</Eq>, color
          by speed. Outside <Eq>{String.raw`\sim 10\,r_s`}</Eq> Newton is within a percent of GR —
          say so, and your sim is honest. This is what the workshop master prompt builds.
        </li>
        <li>
          <strong>Level 2 — one real geodesic.</strong> For a non-spinning hole, planar light rays
          obey a single famous ODE: <Eq>{String.raw`u'' + u = \tfrac{3}{2} r_s u^2`}</Eq> with{" "}
          <Eq>{String.raw`u = 1/r`}</Eq>. Integrate it per ray and you have real lensing in ~20
          lines. Ask your AI to derive it before it codes it — that's the test of whether{" "}
          <em>you</em> are driving.
        </li>
        <li>
          <strong>Level 3 — what the demo does.</strong> Full Kerr Hamiltonian flow + relativistic
          disk shading, as derived above. The complete recipe is on this page and annotated in the
          download.
        </li>
      </ul>

      <Callout kind="warn" title="The point of the demo">
        Any of you could prompt an AI into producing "a black hole simulation." The difference
        between decorative and real is knowing <em>which equations</em> must be in there, and{" "}
        <em>how to check they're actually being solved</em> (conserved quantities, known exact
        numbers like <Eq>{String.raw`3\sqrt3\,M`}</Eq> and the ISCO). That skill — specifying and
        verifying — is exactly what makes you dangerous with AI tools instead of dependent on them.
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
