import Link from "next/link";
import { Callout } from "@/components/Callout";
import { Code } from "@/components/Code";
import MediaSlot from "@/components/MediaSlot";
import { isWorkshopOpen, workshopStartAtIso } from "@/lib/lock";
import LockedScreen from "@/components/LockedScreen";
import { supabaseServer } from "@/lib/supabase/server";
import { isAdmin as checkIsAdmin } from "@/lib/admin";

export const metadata = { title: "Build · Simathon" };

const MASTER_PROMPT = `You are an expert Python + Taichi developer building cinematic physics simulations.

You will be given a physics concept. Your job: produce a single Python file that simulates it, opens a window, and renders it beautifully. The user will run it as 'python sim.py' and expects something visually impressive to appear within seconds.

NON-NEGOTIABLE RULES

1. Stack: Python 3.10, 3.11, or 3.12 + the 'taichi' library only (NumPy allowed for setup arrays). Do not use Python 3.13 or newer — Taichi does not support it yet.
2. Always start the file with:

   import taichi as ti
   try:
       ti.init(arch=ti.gpu)
   except Exception:
       ti.init(arch=ti.cpu)

3. Use Taichi fields (ti.Vector.field, ti.field) for all per-particle state. Never store particle state in Python lists.
4. All physics updates happen inside @ti.kernel functions so they run on GPU.
5. Render with ti.ui.Window at 1280x800 minimum. Use canvas.circles or canvas.lines.
6. Use semi-implicit Euler integration: update velocity from forces first, THEN position from velocity. This is stable.
7. Avoid division by zero. Every distance computation must add a small epsilon (e.g. + 1e-3) before the sqrt or divide.
8. The simulation must keep running indefinitely. If particles fall off or get absorbed, respawn them at a sensible location so the visual stays alive.

PHYSICS ACCURACY

- Use real formulas. F = G*m1*m2/r^2 for gravity. F = q*v×B for magnetic. Hooke's law for springs. Etc.
- Pick units that look right on screen (e.g. scale G so orbits actually orbit instead of flying off). Hardcode them as constants at the top of the file — a physicist should be able to recognize what each constant means and tune it.
- Comment every physics constant with what it represents in SI-equivalent terms.

CINEMATIC QUALITY

- At least 2000 particles. More if it still hits 30+ fps.
- Particles must be small and dense: radius around 0.002–0.004 in normalized canvas coordinates.
- Use a per_vertex_color field, never flat color. Color particles by a physically meaningful scalar:
  * speed → blue (slow) to white (fast) to orange (very fast)
  * energy → deep red (low) to bright yellow (high)
  * distance → choose what looks right
- Background must be near-black (e.g. (0.01, 0.01, 0.03)) so colors pop.
- If the concept allows: draw a central mass, an event horizon, a magnetic field outline, axis markers, etc. as additional render layers.

CODE STRUCTURE

- One single .py file.
- Top docstring (3–5 lines) explaining what the simulation depicts.
- Constants block right after the imports, labeled clearly.
- @ti.func and @ti.kernel functions in the middle.
- Main loop at the bottom inside 'if __name__ == "__main__":'.
- Comments explaining the physics in plain language (the user might be a physics student who doesn't read code well).

ERROR HANDLING

- Wrap window creation in try/except and print a clear message if it fails.
- If the GPU init fails and we fall back to CPU, print a one-line warning telling the user FPS will be lower.

OUTPUT

Just the code. No explanation around it. The user will paste it into a file called sim.py and run it.

Remembering all of these instructions, build a project with the following idea and concept:

`;

const IDEAS = [
  // cosmic
  { tag: "cosmic", title: "Black hole accretion disk", text: "A spinning disk of gas falling into a black hole. Particles glow hotter as they get closer. Some cross the event horizon and disappear forever." },
  { tag: "cosmic", title: "Galaxy collision", text: "Two spiral galaxies pass through each other. Tidal forces tear long arms of stars into space. Real cosmologists call these 'tidal tails.'" },
  { tag: "cosmic", title: "Gravitational lensing", text: "Light from background stars bends around a massive foreground object. Show photons curving and creating multiple images of the same source." },
  { tag: "cosmic", title: "Nebula expansion", text: "A supernova explosion sending a shockwave of glowing gas outward. Color by temperature: hot core, cooling edge." },
  { tag: "cosmic", title: "Globular cluster", text: "A spherical swarm of ~10,000 stars all gravitating toward their shared center of mass. The cluster slowly contracts and breathes." },
  { tag: "cosmic", title: "Cosmic web", text: "Dark matter filaments forming the large-scale structure of the universe — long strands of mass with empty voids in between." },
  { tag: "cosmic", title: "Plasma jet from a quasar", text: "Two narrow beams of ionized particles shooting out perpendicular to an accretion disk. Magnetic field lines twist them into helices." },
  { tag: "cosmic", title: "Pulsar lighthouse", text: "A spinning neutron star with two narrow radiation beams sweeping like a lighthouse. From a fixed observer, it pulses on and off." },

  // solar system
  { tag: "solar", title: "Solar system formation", text: "A protoplanetary disk of dust and gas. Particles clump from gravity, planets emerge, gaps form where rings used to be." },
  { tag: "solar", title: "Saturn's rings with shepherd moons", text: "Thousands of ring particles in orbit around Saturn. Two small moons on either side of the ring keep its edges sharp." },
  { tag: "solar", title: "Comet tail in solar wind", text: "A comet flies past the sun. Its tail always points away from the sun (not opposite its motion) — that's the real physics." },
  { tag: "solar", title: "Asteroid belt resonances", text: "Asteroids orbiting between Mars and Jupiter. Some orbital periods become unstable due to Jupiter's gravity — show the gaps form (Kirkwood gaps)." },
  { tag: "solar", title: "Tidal stretching", text: "A planet very close to a star or a moon close to a gas giant. Show it stretch along the gravity gradient — same effect that powers Io's volcanoes." },
  { tag: "solar", title: "Lagrange points", text: "Show the 5 Lagrange points of a two-body system. Drop test particles near each — only L4 and L5 are stable, the rest drift away." },

  // exotic
  { tag: "exotic", title: "Three-body chaos", text: "Three stars orbiting each other with no analytical solution. Tiny initial differences explode into completely different paths. Pure chaos, visually mesmerizing." },
  { tag: "exotic", title: "Wormhole funnel", text: "An Einstein-Rosen bridge as a 3D throat connecting two regions. Test particles fall in one side and come out the other." },
  { tag: "exotic", title: "Aurora borealis", text: "Charged particles from solar wind spiraling along Earth's magnetic field lines, glowing green and red as they hit the upper atmosphere." },
  { tag: "exotic", title: "Magnetic reconnection", text: "Two opposing magnetic field lines snap together, releasing energy. The mechanism behind solar flares. Particles get flung outward at high speed." },
  { tag: "exotic", title: "Hawking radiation", text: "Particle-antiparticle pairs forming near an event horizon. One falls in, the other escapes. The black hole slowly evaporates." },

  // earth-scale
  { tag: "earth", title: "Pendulum wave", text: "15 pendulums of slightly different lengths, all swinging together. They desynchronize, then re-synchronize in waves of pattern." },
  { tag: "earth", title: "Double pendulum chaos", text: "Two pendulums attached end-to-end. Trace the tip's path — it never repeats, and small changes in start create wildly different traces." },
  { tag: "earth", title: "Lightning fractal", text: "A branching electrical discharge. Each step picks the direction of steepest voltage drop, with some randomness. The result branches like real lightning." },
  { tag: "earth", title: "Smoke rising", text: "Buoyancy + turbulence. Particles rise from a heat source, swirl, curl into vortices, fade." },
  { tag: "earth", title: "Sand in zero-g", text: "A blob of granular material released in microgravity. Mutual gravity slowly pulls it into a sphere — same way moons form." },
] as const;

const tagColor: Record<string, string> = {
  cosmic: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  solar: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  exotic: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  earth: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

export default async function WorkshopPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user ? await checkIsAdmin(supabase, user.email) : false;
  if (!isWorkshopOpen() && !isAdmin) {
    return <LockedScreen startsAtIso={workshopStartAtIso()} title="The Build guide unlocks when the workshop starts." />;
  }
  return (
    <div className="prose-body max-w-3xl mx-auto">
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">02 · the workshop</div>
      <h1 className="text-3xl font-bold mt-1">Build your sim</h1>
      <p className="text-ink/80 mt-2 text-[15px]">
        You don't write code. You give the AI a physics concept and a set of instructions, and it builds the simulation
        for you. Your job is to <em>pick the idea</em> and <em>guide it</em>. That's the whole workshop.
      </p>
      <p className="text-ink/70 mt-2 text-sm">
        Want to see what's possible first? <Link href="/blackhole" className="text-accent">Watch the live demo and read the physics</Link>.
      </p>

      <Callout title="Use whatever tools you want">
        This guide uses Antigravity + Taichi because it's the easiest path from zero to a working sim. But if you'd
        rather use Claude, ChatGPT, VS Code with Copilot, plain Python with pygame, three.js in the browser, Unity,
        Blender — go ahead. Pick what gets <em>you</em> to a beautiful simulation fastest. The only thing that matters
        at the end is what you submit.
      </Callout>

      {/* How it works */}
      <h2>How it works (3 steps)</h2>
      <ol>
        <li>
          Open Antigravity (the app you installed in <Link href="/setup" className="text-accent">setup</Link>).
          File → Open Folder → make a new folder anywhere (name it whatever — <code>my-sim</code>,{" "}
          <code>blackhole</code>). Open it.
        </li>
        <li>
          Open the AI chat panel. Pick the <strong>cheapest model</strong> that gives sensible output — save the
          expensive ones for when you're stuck.
        </li>
        <li>
          Paste the master prompt below, then your chosen idea right after the last line. Hit Enter. Then just{" "}
          <strong>keep clicking the green buttons</strong> Antigravity shows — Run, Accept, Allow, Keep. Let the
          agent do its job. Don't try to read every line of code.
        </li>
      </ol>

      <Callout kind="check" title="Let it cook">
        The whole point of Antigravity is that you don't write or read code — you watch the agent write it and click
        Accept. If it crashes, paste the error back and say "fix this." That's the entire loop.
      </Callout>

      <Callout kind="warn" title="Watch your model limits">
        AI agents get rate-limited or throttled if you hammer the biggest model. Start on the smallest one. Switch
        up only when it gets genuinely stuck. Otherwise you'll hit a wall mid-workshop.
      </Callout>

      <MediaSlot kind="video" caption="watch: full workshop loop — paste prompt, hit run, keep clicking accept" />

      {/* The master prompt */}
      <h2>The master prompt</h2>
      <p>
        Copy this. Paste it into Antigravity's chat. Then at the bottom — right after "build a project with the following
        idea and concept:" — paste your chosen idea (see the gallery below).
      </p>

      <Code language="prompt">{MASTER_PROMPT}</Code>

      <Callout kind="warn" title="Don't paraphrase it">
        The rules in this prompt exist because they prevent specific bugs. If the AI's output doesn't run, copy the
        error message back into chat and say "fix this." Don't start over from a different prompt.
      </Callout>

      {/* The ideas */}
      <h2 id="ideas">Idea gallery — pick one (or write your own)</h2>
      <p>
        Each card is a starting point. Copy the title + the sentence below it into the prompt. Or remix two —
        a galaxy collision <em>inside</em> a wormhole, lighting from gravity instead of voltage, whatever you want.
        Going crazy is encouraged.
      </p>

      <div className="grid sm:grid-cols-2 gap-3 not-prose my-4">
        {IDEAS.map((idea) => (
          <div
            key={idea.title}
            className="rounded-xl border border-white/10 bg-panel/50 p-4 hover:border-accent/40 transition"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="text-sm font-semibold text-ink">{idea.title}</div>
              <span
                className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${tagColor[idea.tag]}`}
              >
                {idea.tag}
              </span>
            </div>
            <div className="text-xs text-ink/75 leading-relaxed">{idea.text}</div>
          </div>
        ))}
      </div>

      {/* Iterate */}
      <h2>After the first version runs</h2>
      <p>
        You'll get a window with your sim. It probably won't look perfect on the first try. That's fine. Open
        Antigravity's chat again and tell it what you want to change. Examples:
      </p>
      <ul>
        <li>"make the particles brighter and trail-like"</li>
        <li>"add a second black hole at the top-right with half the mass"</li>
        <li>"color particles by their speed instead of distance"</li>
        <li>"add 5x more particles"</li>
        <li>"the orbits look unstable, fix the integrator step size"</li>
        <li>"make the background dark navy with subtle stars"</li>
      </ul>

      <p>
        Each round, Antigravity edits the file. You hit Run again. Repeat until it looks like something you'd post
        on Instagram. That's the whole iteration loop.
      </p>

      <Callout kind="check" title="A good sim has">
        Real physics under the hood, dense smooth motion, color that means something, and a moment where you go
        "huh, that's actually beautiful." If you've got that — you're done.
      </Callout>

      {/* Push to GitHub */}
      <h2>Push it to GitHub</h2>
      <p>
        Once your sim looks good, upload the folder to GitHub so we (and everyone else) can see the code.
      </p>
      <ol>
        <li>
          In your browser, go to{" "}
          <a href="https://github.com/new" target="_blank" rel="noreferrer">
            github.com/new
          </a>
          . Give the repo a name. Pick <strong>Public</strong>. Skip the README + gitignore + license — just click
          Create repository.
        </li>
        <li>
          GitHub shows you a page with a URL like <code>https://github.com/&lt;you&gt;/&lt;repo&gt;.git</code>.
          Copy it.
        </li>
        <li>
          Back in Antigravity's chat, paste:{" "}
          <em>"initialize git in this folder, commit everything, and push it to &lt;paste your repo URL&gt;"</em>.
          Hit Enter. Approve every button — install prompts, credential prompts, etc.
        </li>
        <li>
          On first push, Git will open a browser window asking you to log in to GitHub. Log in. Approve. Come
          back to Antigravity — it'll finish the push.
        </li>
        <li>Refresh the GitHub page. Your files should be there.</li>
      </ol>

      <Callout title="If Antigravity fumbles the git commands">
        Run these yourself in the terminal at the bottom of Antigravity. Replace the URL with yours:
        <div className="mt-2">
          <pre><code>{`git init
git add .
git commit -m "first sim"
git branch -M main
git remote add origin https://github.com/YOU/YOURREPO.git
git push -u origin main`}</code></pre>
        </div>
        First push pops open a browser for GitHub login. Log in, approve, done.
      </Callout>

      {/* Common */}
      <h2>If it breaks</h2>
      <ul>
        <li>
          <strong>Window opens then closes instantly</strong> — paste the error from Antigravity's terminal back
          into chat: "this crashed, fix it."
        </li>
        <li>
          <strong>Black window, nothing rendering</strong> — likely a coord issue. Say "the canvas is black,
          particles are off-screen."
        </li>
        <li>
          <strong>Runs at 2 fps</strong> — say "this is too slow on my CPU, reduce particle count to 1000 and use
          smaller radius."
        </li>
        <li>
          <strong>Antigravity refuses or hits a rate limit</strong> — switch to a different model in the chat picker.
          Or fall back to{" "}
          <a href="https://claude.ai" target="_blank" rel="noreferrer">claude.ai</a> /{" "}
          <a href="https://chatgpt.com" target="_blank" rel="noreferrer">chatgpt.com</a> in your browser, paste the
          master prompt + idea there, and copy the code into a file in Antigravity manually.
        </li>
        <li>
          <strong>Stuck anywhere else</strong> —{" "}
          <Link href="/chat" className="text-accent">
            chat
          </Link>
          .
        </li>
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/hackathon"
          className="px-4 py-2 rounded-md bg-accent text-black font-semibold text-sm"
        >
          read the hackathon rules →
        </Link>
        <Link href="/submit" className="btn-ghost">
          submit when ready
        </Link>
      </div>
    </div>
  );
}
