import { Callout } from "@/components/Callout";
import { Code } from "@/components/Code";
import Link from "next/link";

export const metadata = { title: "The Workshop · Build a Black Hole" };

const TOC = [
  { id: "before", label: "Before we begin" },
  { id: "chapter-1", label: "1 · Your first pixel" },
  { id: "chapter-2", label: "2 · A field of particles" },
  { id: "chapter-3", label: "3 · Gravity" },
  { id: "chapter-4", label: "4 · The black hole" },
  { id: "chapter-5", label: "5 · Make it cinematic" },
  { id: "copilot", label: "Vibe-coding with Copilot" },
  { id: "next", label: "What now?" },
];

export default function WorkshopPage() {
  return (
    <div className="grid md:grid-cols-[1fr_220px] gap-10">
      <div className="prose-body">
        <div className="text-xs uppercase tracking-[0.2em] text-accent2">the workshop</div>
        <h1 className="text-4xl md:text-5xl font-extrabold mt-1">Build a black hole.</h1>
        <p className="text-ink/85 text-lg mt-3">
          Two hours. Five chapters. You start with an empty file. You end with a black hole eating particles on your screen.
        </p>

        <Callout title="How to use this page">
          During the live Zoom call, follow along. After the call, this page IS the recording — it's everything you need
          to redo or finish the build solo. Stuck on a step? Drop a message in <Link href="/chat" className="text-accent">chat</Link>.
        </Callout>

        {/* Before */}
        <h2 id="before">Before we begin</h2>
        <p>
          You've done the <Link href="/setup" className="text-accent">setup</Link>. Your terminal is open. Your venv is active
          (the prompt starts with <code>(venv)</code>). VS Code is open in your <code>blackhole</code> folder.
        </p>
        <p>
          Make a new file called <code>sim.py</code>. This is where we'll build the whole thing.
        </p>

        <Callout kind="warn" title="One mental model before we start">
          A simulation is just: <em>a bag of numbers + a rule that updates them, 60 times a second</em>. The numbers are
          positions and velocities of particles. The rule is physics. That's it. There's no magic.
        </Callout>

        {/* Chapter 1 */}
        <h2 id="chapter-1">1 · Your first pixel</h2>
        <p>
          We're going to put a single dot on the screen and make it move. That's it. If we can do this, everything else is
          just <em>more of the same</em>.
        </p>

        <p>Paste this into <code>sim.py</code>:</p>
        <Code language="python">{`import taichi as ti

# Try GPU first, fall back to CPU if no GPU. Don't worry which one wins.
try:
    ti.init(arch=ti.gpu)
except Exception:
    ti.init(arch=ti.cpu)

W, H = 800, 600  # window size in pixels

# A "field" is a Taichi array that lives on the GPU.
# We store the position of one particle as a 2D vector.
pos = ti.Vector.field(2, dtype=ti.f32, shape=())
vel = ti.Vector.field(2, dtype=ti.f32, shape=())

pos[None] = ti.Vector([W / 2, H / 2])   # start in the middle
vel[None] = ti.Vector([2.0, 1.5])       # moving up-right


@ti.kernel
def step():
    pos[None] += vel[None]
    # Bounce off the walls
    if pos[None][0] < 0 or pos[None][0] > W:
        vel[None][0] *= -1
    if pos[None][1] < 0 or pos[None][1] > H:
        vel[None][1] *= -1


window = ti.ui.Window("First pixel", (W, H))
canvas = window.get_canvas()

while window.running:
    step()
    canvas.set_background_color((0.02, 0.02, 0.05))
    # Taichi UI expects 0..1 coords, so we normalize.
    p_norm = ti.Vector.field(2, dtype=ti.f32, shape=(1,))
    p_norm[0] = pos[None] / ti.Vector([W, H])
    canvas.circles(p_norm, radius=0.01, color=(1.0, 0.6, 0.2))
    window.show()
`}</Code>

        <p>Save the file. In your terminal:</p>
        <Code language="bash">python sim.py</Code>

        <Callout kind="check" title="You should see">
          A black window with an orange dot bouncing around like a DVD logo. <strong>You just wrote a simulation.</strong>
          Close the window when you're done admiring it.
        </Callout>

        <Callout kind="warn" title="Stuck?">
          <ul>
            <li><strong>"No module named taichi"</strong> — your venv isn't active. Re-run the activate command.</li>
            <li><strong>Window is white / nothing renders</strong> — try changing <code>ti.gpu</code> to <code>ti.cpu</code>.</li>
            <li><strong>Black window, no dot</strong> — likely a typo. Copy the snippet again from this page.</li>
          </ul>
        </Callout>

        {/* Chapter 2 */}
        <h2 id="chapter-2">2 · A field of particles</h2>
        <p>
          One particle is a toy. One thousand is a universe. We change one number: <code>shape=()</code> becomes
          <code>shape=N</code>, and Taichi makes it parallel. Replace the whole file with:
        </p>

        <Code language="python">{`import taichi as ti
import numpy as np

try:
    ti.init(arch=ti.gpu)
except Exception:
    ti.init(arch=ti.cpu)

W, H = 800, 600
N = 1000  # number of particles

pos = ti.Vector.field(2, dtype=ti.f32, shape=N)
vel = ti.Vector.field(2, dtype=ti.f32, shape=N)


@ti.kernel
def init_particles():
    for i in range(N):
        pos[i] = ti.Vector([ti.random() * W, ti.random() * H])
        # random velocity, mostly slow
        vel[i] = ti.Vector([(ti.random() - 0.5) * 2.0,
                            (ti.random() - 0.5) * 2.0])


@ti.kernel
def step():
    for i in range(N):
        pos[i] += vel[i]
        if pos[i][0] < 0 or pos[i][0] > W:
            vel[i][0] *= -1
        if pos[i][1] < 0 or pos[i][1] > H:
            vel[i][1] *= -1


# A "view" field — Taichi UI wants normalized 0..1 coords.
pos_view = ti.Vector.field(2, dtype=ti.f32, shape=N)


@ti.kernel
def update_view():
    for i in range(N):
        pos_view[i] = pos[i] / ti.Vector([W, H])


init_particles()
window = ti.ui.Window("Field of particles", (W, H))
canvas = window.get_canvas()

while window.running:
    step()
    update_view()
    canvas.set_background_color((0.02, 0.02, 0.05))
    canvas.circles(pos_view, radius=0.003, color=(1.0, 0.6, 0.2))
    window.show()
`}</Code>

        <p>Run it again.</p>

        <Callout kind="check" title="You should see">
          A thousand orange dots, all bouncing independently. A field of fireflies. Notice how the GPU handled 1000
          particles as easily as 1 — that's the whole point of Taichi.
        </Callout>

        <p>
          <strong>Try this:</strong> change <code>N = 1000</code> to <code>N = 50000</code>. Re-run. Most laptops will still
          handle it. Push it until it stutters. <em>That's</em> the line between your CPU and GPU.
        </p>

        {/* Chapter 3 */}
        <h2 id="chapter-3">3 · Gravity</h2>
        <p>
          Right now the dots bounce around with no purpose. Let's give them a goal — they all fall toward a point in the middle.
        </p>
        <p>
          Newton's law of gravity says: the acceleration pulling something toward a mass at distance <code>r</code> is{" "}
          <code>a = G · M / r²</code>, pointed toward the mass. We're going to apply that to every particle, every frame.
        </p>

        <p>
          Replace your <code>step()</code> function with this:
        </p>

        <Code language="python">{`G = 0.5          # gravity strength (tune this)
M = 500.0        # mass at the center
CENTER = ti.Vector([W / 2, H / 2])


@ti.kernel
def step():
    for i in range(N):
        to_center = CENTER - pos[i]
        r2 = to_center.dot(to_center) + 10.0  # +10 so we don't divide by zero
        r = ti.sqrt(r2)
        direction = to_center / r
        accel = G * M / r2
        vel[i] += direction * accel
        pos[i] += vel[i]
`}</Code>

        <p>
          Also remove the wall-bounce code — we don't need walls anymore. Particles that fly off will be replaced later.
        </p>

        <p>Run.</p>

        <Callout kind="check" title="You should see">
          All the particles get sucked toward the center. Some loop around it like comets. Some go straight in.
          A few might escape entirely. <strong>That's real Newtonian gravity</strong> — the same math that puts satellites
          in orbit. You wrote it in 8 lines.
        </Callout>

        <Callout kind="warn" title="Looks too violent?">
          Lower <code>G</code> to <code>0.1</code>. Want orbits to look more graceful? Set initial velocities perpendicular
          to the center (we'll do this in chapter 4).
        </Callout>

        {/* Chapter 4 */}
        <h2 id="chapter-4">4 · The black hole</h2>
        <p>
          A black hole is a mass with one extra rule: <em>once you get too close, you don't come back</em>. We're going to:
        </p>
        <ul>
          <li>Spawn particles in a ring, with the right velocity for an orbit (so we get a beautiful spiral, not a stampede).</li>
          <li>Delete particles that cross the event horizon.</li>
          <li>Respawn them at the edge so the show never ends.</li>
        </ul>

        <p>Replace the whole file with this. Read the comments as you paste.</p>

        <Code language="python">{`import taichi as ti
import math

try:
    ti.init(arch=ti.gpu)
except Exception:
    ti.init(arch=ti.cpu)

W, H = 1000, 800
N = 4000

G = 1.0
M = 800.0
EVENT_HORIZON = 12.0     # radius (in pixels) of the "no return" zone
SPAWN_R_MIN = 180.0
SPAWN_R_MAX = 330.0

CENTER = ti.Vector([W / 2, H / 2])

pos = ti.Vector.field(2, dtype=ti.f32, shape=N)
vel = ti.Vector.field(2, dtype=ti.f32, shape=N)
color = ti.Vector.field(3, dtype=ti.f32, shape=N)
alive = ti.field(dtype=ti.i32, shape=N)


@ti.func
def seed(i):
    angle = ti.random() * 2.0 * math.pi
    r = SPAWN_R_MIN + ti.random() * (SPAWN_R_MAX - SPAWN_R_MIN)
    pos[i] = CENTER + ti.Vector([ti.cos(angle), ti.sin(angle)]) * r

    # Tangent direction = perpendicular to radial direction.
    # This gives us a circular orbit instead of a head-on fall.
    tangent = ti.Vector([-ti.sin(angle), ti.cos(angle)])
    orbital_speed = ti.sqrt(G * M / r) * 0.95
    vel[i] = tangent * orbital_speed

    # Color: blue-white outer ring, hot orange inner.
    t = (r - SPAWN_R_MIN) / (SPAWN_R_MAX - SPAWN_R_MIN)
    color[i] = ti.Vector([
        1.0 - t * 0.4,
        0.6 + t * 0.3,
        0.3 + t * 0.7,
    ])
    alive[i] = 1


@ti.kernel
def init_particles():
    for i in range(N):
        seed(i)


@ti.kernel
def step():
    for i in range(N):
        if alive[i] == 1:
            to_center = CENTER - pos[i]
            r2 = to_center.dot(to_center)
            r = ti.sqrt(r2 + 1.0)
            direction = to_center / r
            accel = G * M / (r2 + 1.0)
            vel[i] += direction * accel
            pos[i] += vel[i]

            # Crossed the event horizon? Respawn.
            if r < EVENT_HORIZON:
                seed(i)


# Normalized positions for rendering.
pos_view = ti.Vector.field(2, dtype=ti.f32, shape=N)


@ti.kernel
def update_view():
    for i in range(N):
        pos_view[i] = pos[i] / ti.Vector([W, H])


init_particles()
window = ti.ui.Window("Black Hole", (W, H))
canvas = window.get_canvas()

while window.running:
    step()
    update_view()
    canvas.set_background_color((0.0, 0.0, 0.02))
    canvas.circles(pos_view, radius=0.0025, per_vertex_color=color)
    window.show()
`}</Code>

        <p>Run.</p>

        <Callout kind="check" title="You should see">
          A glowing disk of orbiting particles around a black void in the center. Particles spiral inward and disappear.
          New ones keep appearing at the outer edge. <strong>Congratulations. You built a black hole accretion disk.</strong>
        </Callout>

        {/* Chapter 5 */}
        <h2 id="chapter-5">5 · Make it cinematic</h2>
        <p>
          A working sim is not the same as a beautiful one. Three changes turn this from "physics homework" into "post this on Instagram":
        </p>

        <h3>5a. The black void</h3>
        <p>Right now there's nothing visibly marking the black hole itself. Let's draw it:</p>
        <Code language="python">{`# Add somewhere before the main loop:
hole_pos = ti.Vector.field(2, dtype=ti.f32, shape=(1,))
hole_pos[0] = CENTER / ti.Vector([W, H])

# Inside the loop, BEFORE drawing the particles:
canvas.circles(hole_pos, radius=EVENT_HORIZON / W, color=(0.0, 0.0, 0.0))
`}</Code>

        <h3>5b. The photon ring</h3>
        <p>
          Around the event horizon, light bends so much that it can <em>orbit the black hole</em>. We can't simulate
          full general relativity in 2 hours, but we can fake the visual — a glowing orange ring just outside the horizon:
        </p>
        <Code language="python">{`# Make a ring of points
import numpy as np
RING_N = 200
PHOTON_R = EVENT_HORIZON * 1.6
ring = ti.Vector.field(2, dtype=ti.f32, shape=RING_N)
ring_np = np.zeros((RING_N, 2), dtype=np.float32)
for k in range(RING_N):
    a = 2 * np.pi * k / RING_N
    ring_np[k] = [CENTER[0] + np.cos(a) * PHOTON_R, CENTER[1] + np.sin(a) * PHOTON_R]
ring_np /= np.array([W, H])
ring.from_numpy(ring_np)

# Inside the loop, between the black void and the particles:
canvas.circles(ring, radius=0.002, color=(1.0, 0.55, 0.15))
`}</Code>

        <h3>5c. More particles, smaller</h3>
        <p>Push <code>N</code> up to <code>20000</code> and drop the radius to <code>0.0015</code>. Density is everything.</p>

        <Callout kind="check" title="You should see">
          A genuinely beautiful black hole: dense, glowing, alive. Take a screenshot. Post it somewhere. People will not
          believe you wrote it today.
        </Callout>

        {/* Copilot */}
        <h2 id="copilot">Vibe-coding with Copilot (use this all week)</h2>
        <p>
          You don't need to remember Python syntax for the hackathon. You just need to know <em>how to talk to Copilot</em>.
          Open Copilot Chat in VS Code (right sidebar). Here are prompts that actually work:
        </p>

        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-white/10 p-3">
            <div className="text-muted">Prompt</div>
            <div className="font-mono text-ink">
              "Add a second black hole at (300, 400) with half the mass. Both should pull on all particles."
            </div>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <div className="text-muted">Prompt</div>
            <div className="font-mono text-ink">
              "When a particle gets close to the event horizon, make it stretch into a trail before disappearing
              (spaghettification)."
            </div>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <div className="text-muted">Prompt</div>
            <div className="font-mono text-ink">
              "Color particles by their speed using a hot colormap — slow is deep red, fast is white."
            </div>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <div className="text-muted">Prompt</div>
            <div className="font-mono text-ink">
              "Add trails: when I render each particle, draw the last 10 positions fading out."
            </div>
          </div>
        </div>

        <Callout kind="warn" title="Copilot will sometimes lie">
          It can suggest code that looks right but uses Taichi APIs that don't exist. If you get an error, paste the error
          back into Copilot Chat: "I got this error: ..." It almost always fixes it on the second try.
        </Callout>

        {/* Next */}
        <h2 id="next">What now?</h2>
        <ul>
          <li>You have a working black hole. <strong>This is your starting point for the hackathon.</strong></li>
          <li>Save your file. Make a GitHub account (we'll need it for submission).</li>
          <li>Read the <Link href="/hackathon" className="text-accent">hackathon rules</Link>.</li>
          <li>For inspiration, the <Link href="/gallery" className="text-accent">gallery</Link> opens once submissions start.</li>
          <li>Stuck? <Link href="/chat" className="text-accent">Chat is open all week.</Link></li>
        </ul>

        <div className="mt-10 flex gap-3">
          <Link href="/hackathon" className="px-5 py-2.5 rounded-md bg-accent text-black font-semibold">
            See the hackathon rules →
          </Link>
          <Link href="/chat" className="px-5 py-2.5 rounded-md bg-white/10 hover:bg-white/15 font-semibold">
            Ask a question
          </Link>
        </div>
      </div>

      {/* TOC */}
      <aside className="hidden md:block">
        <div className="sticky top-24 text-sm">
          <div className="text-xs uppercase tracking-[0.2em] text-muted mb-2">on this page</div>
          <ul className="space-y-1.5">
            {TOC.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="text-ink/70 hover:text-accent">{t.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
