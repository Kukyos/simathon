import Link from "next/link";
import { Callout } from "@/components/Callout";
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
      <h1 className="text-3xl font-bold mt-1">What you're actually simulating</h1>
      <p className="text-ink/85 mt-2 text-[15px]">
        At the live event you'll watch a black hole simulation running on a real GPU. Then you'll build
        your own. This page explains what's actually happening on screen — enough to bluff a physicist,
        enough to remix into something better.
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

      <Callout title="The honest version">
        The workshop's job is to teach you to ship a sim that <em>looks</em> like a black hole. Mine
        uses Newtonian gravity with a hard cutoff at the event horizon — that's enough to be visually
        correct and physically meaningful. The cinematic features (lensing, photon sphere) are added
        on top as shader tricks. If you want to do the real thing — null geodesics on a Schwarzschild
        background — read on. Both are valid.
      </Callout>

      <h2>The five things on screen</h2>

      <h3>1. The singularity</h3>
      <p>
        Not a dot — a point where the equations break. In Einstein's theory, mass curves spacetime,
        and inside a black hole the curvature goes to infinity at the center. We don't draw it. There
        is nothing to draw. The thing you see in the middle is empty.
      </p>

      <h3>2. The event horizon</h3>
      <p>
        The dark sphere. It's the surface where escape velocity equals the speed of light — meaning
        nothing inside, not even light, gets out. For a non-rotating black hole of mass <em>M</em>,
        its radius is the <strong>Schwarzschild radius</strong>:
      </p>
      <pre className="bg-panel/60 border border-white/10 rounded-md p-3 text-sm overflow-x-auto"><code>r_s = 2GM / c²</code></pre>
      <p>
        Sun-mass black hole → 3 km. Earth-mass → 9 mm. Sagittarius A* (the one at our galaxy's center)
        → about 12 million km. The horizon isn't a physical surface. It's a boundary in spacetime: cross
        it, and every future-pointing path leads to the singularity.
      </p>

      <h3>3. The photon sphere</h3>
      <p>
        At <code>1.5 × r_s</code>, light can orbit the black hole in a circle. Just once, or many times,
        before either escaping or falling in. This is what makes the black hole's silhouette look bigger
        than its horizon — photons coming from behind it can curve around and reach your eye, painting a
        bright ring. The dark disk in the famous Event Horizon Telescope image is roughly{" "}
        <code>2.6 × r_s</code> wide because of this.
      </p>

      <h3>4. The accretion disk</h3>
      <p>
        Gas spiraling inward. As it falls, friction heats it to millions of degrees — bright blue at the
        inside edge, fading to red at the outside. The disk can't get arbitrarily close: stable circular
        orbits stop at the <strong>ISCO</strong> (innermost stable circular orbit),{" "}
        <code>3 × r_s</code> for a non-spinning black hole. Inside that radius, anything orbiting plunges
        in within a few revolutions.
      </p>
      <p>
        We render the disk as ~200k particles each on Keplerian orbits with the ISCO cutoff, colored by
        a temperature curve. The light from each particle gets gravitationally redshifted and Doppler-shifted
        based on its speed and position. That's why one side of the disk looks brighter than the other.
      </p>

      <h3>5. The lensing</h3>
      <p>
        Every background star behind the black hole gets warped around it. Light follows the curvature
        of spacetime, which means rays bend smoothly toward the mass. Far from the hole the bending is
        tiny (this is how Eddington proved Einstein right in 1919). Close to the photon sphere, the same
        star can show up twice, or as a ring (an{" "}
        <strong>Einstein ring</strong>) if it's exactly behind.
      </p>
      <p>
        In the demo this is a fragment shader. Each pixel computes the impact parameter of the light ray
        from the camera, integrates it along the geodesic on a Schwarzschild background, and samples the
        sky texture at the deflected angle. Pure ray tracing, no particles needed for this part.
      </p>

      <h2>Newtonian vs. relativistic — what's in your sim</h2>

      <p>
        If you're using the workshop master prompt with one of the cosmic ideas, you're building a{" "}
        <strong>Newtonian</strong> simulation:
      </p>

      <pre className="bg-panel/60 border border-white/10 rounded-md p-3 text-sm overflow-x-auto"><code>F = G * m1 * m2 / r²</code></pre>

      <p>
        That formula was wrong for over a century — Mercury's orbit didn't match. Einstein fixed it in
        1915 by replacing "force" with "curved geometry." But here's the thing: for everything outside
        the photon sphere, the Newtonian answer is{" "}
        <em>almost exactly right</em>. The relativistic corrections start mattering at maybe a few
        percent for an orbit at <code>10 × r_s</code>, and only blow up close to the horizon.
      </p>

      <p>So a Newtonian black hole sim is honest if you:</p>
      <ul>
        <li>
          Use inverse-square gravity and set a "hole" radius. Anything inside it gets absorbed (replace
          with a respawn).
        </li>
        <li>Don't pretend particles can sit on stable orbits closer than ~3× the horizon radius.</li>
        <li>
          Color by speed or potential energy. Hot blue inside, cool red outside is real — accretion
          disks really do that.
        </li>
      </ul>

      <p>
        You don't need the full GR machinery to make something cinematically true. You need it if you
        want to show <em>lensing</em>, <em>frame dragging</em>, or accurate <em>photon orbits</em>.
        Those are graphics-level effects more than physics-level — you can add them as shader passes
        on top of a Newtonian particle sim. Which is exactly what the demo does.
      </p>

      <Callout kind="check" title="For the curious">
        If you want to do real numerical GR: integrate the geodesic equation{" "}
        <code>d²xᵘ/dλ² + Γᵘ_νρ (dxᵛ/dλ)(dxᵖ/dλ) = 0</code> on a Schwarzschild metric, parametrized by
        affine parameter λ. The Christoffel symbols are textbook. For a static spherical black hole
        you can reduce it to a 2D problem in the orbital plane and integrate two ODEs (r and φ vs. λ)
        with RK4. That's a weekend project, not a workshop. The Einstein Toolkit / GRChombo are
        full numerical-relativity packages; you don't need them for visualization.
      </Callout>

      <h2>What to do with this</h2>
      <ul>
        <li>
          <strong>Watch the demo run.</strong> Notice the disk warping behind the hole. That's lensing.
          Notice the ring just outside the horizon. That's the photon sphere edge.
        </li>
        <li>
          <strong>Try to reproduce one feature.</strong> The accretion disk is the easiest target —
          particles on Keplerian orbits with an ISCO cutoff. Lensing is the hardest.
        </li>
        <li>
          <strong>Don't copy the demo's code.</strong> It's C++ + OpenGL because that's what I had time
          to write. Your version in Python + Taichi can be more beautiful with a fraction of the code.
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
