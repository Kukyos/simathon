import { Callout } from "@/components/Callout";
import { Code } from "@/components/Code";
import Link from "next/link";

export const metadata = { title: "Setup · Workshop" };

export default function SetupPage() {
  return (
    <div className="prose-body max-w-3xl mx-auto">
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">step 0 · do this BEFORE the workshop</div>
      <h1 className="text-4xl font-extrabold mt-1">Setup guide</h1>
      <p className="text-ink/85 mt-3">
        About 20 minutes. Do this the day <em>before</em> the workshop, not 5 minutes before — installs can be slow,
        and we won't have time to debug yours live. There are checkpoints. If a checkpoint fails, stop and
        post in the <Link href="/chat" className="text-accent">chat</Link>.
      </p>

      <Callout title="What you need">
        A laptop (Windows / macOS / Linux), an internet connection, about 5 GB of free disk space, and a Gmail or
        school email address. That's it.
      </Callout>

      {/* Step 1 */}
      <h2>1. Install Python</h2>
      <p>Python is the language we'll use. We need version 3.10 or newer.</p>

      <h3>Windows</h3>
      <ol>
        <li>Go to <a href="https://www.python.org/downloads/" target="_blank" rel="noreferrer">python.org/downloads</a> and download the latest Python.</li>
        <li>Run the installer. <strong>Important:</strong> tick the box that says <em>"Add python.exe to PATH"</em> on the first screen.</li>
        <li>Click "Install Now" and wait.</li>
      </ol>

      <h3>macOS</h3>
      <p>If you have Homebrew:</p>
      <Code language="bash">brew install python@3.12</Code>
      <p>If you don't, download from <a href="https://www.python.org/downloads/" target="_blank" rel="noreferrer">python.org</a> and run the installer.</p>

      <h3>Linux</h3>
      <Code language="bash">{`sudo apt update && sudo apt install -y python3 python3-pip python3-venv`}</Code>

      <Callout kind="check" title="Checkpoint">
        Open a terminal (Windows: search "PowerShell" in Start menu; Mac: search "Terminal" in Spotlight) and run:
        <div className="mt-2"><Code language="bash">python --version</Code></div>
        You should see <code>Python 3.10</code> or higher. If you see "command not found," reinstall and make sure you tick "Add to PATH."
      </Callout>

      {/* Step 2 */}
      <h2>2. Install VS Code</h2>
      <ol>
        <li>Download from <a href="https://code.visualstudio.com/" target="_blank" rel="noreferrer">code.visualstudio.com</a>.</li>
        <li>Install with default settings.</li>
        <li>Open VS Code. On the left sidebar, click the squares icon ("Extensions").</li>
        <li>Search for <strong>Python</strong> (by Microsoft) → click <em>Install</em>.</li>
      </ol>

      <Callout kind="check" title="Checkpoint">
        VS Code is open, the Python extension is installed. You'll see a "Python" indicator in the bottom-right bar when you open a <code>.py</code> file.
      </Callout>

      {/* Step 3 */}
      <h2>3. Install GitHub Copilot (the magic part)</h2>
      <p>
        Copilot is the AI that will write most of your code. You describe what you want; it types. This is the entire reason
        you don't need to know Python in advance.
      </p>
      <ol>
        <li>
          Sign up for a <strong>free GitHub Student Developer Pack</strong> at{" "}
          <a href="https://education.github.com/pack" target="_blank" rel="noreferrer">education.github.com/pack</a>.
          You'll need to upload your student ID or use your school email. This unlocks Copilot for free.
        </li>
        <li>While you wait for approval (can take a few hours to a day), continue with the rest of the setup.</li>
        <li>
          In VS Code → Extensions → search for <strong>GitHub Copilot</strong> → install it. Sign in with your GitHub account
          when prompted.
        </li>
        <li>Also install <strong>GitHub Copilot Chat</strong> from the same extensions panel.</li>
      </ol>
      <Callout kind="warn" title="No student pack yet?">
        If Copilot approval hasn't come through by workshop day, you can get a 30-day free trial of regular Copilot. Or use{" "}
        <a href="https://aistudio.google.com" target="_blank" rel="noreferrer">Google AI Studio (free)</a> as a fallback —
        we'll show you how to paste-and-go during the workshop.
      </Callout>

      {/* Step 4 */}
      <h2>4. Make a project folder + virtual environment</h2>
      <p>
        A virtual environment ("venv") is just a private Python sandbox for this project — so packages we install don't fight
        with your system Python. Open your terminal and run:
      </p>
      <Code language="bash">{`mkdir blackhole
cd blackhole
python -m venv venv`}</Code>

      <p>Now <em>activate</em> the venv:</p>
      <h3>Windows (PowerShell):</h3>
      <Code language="bash">.\venv\Scripts\Activate.ps1</Code>
      <Callout kind="warn">
        If PowerShell says "cannot be loaded because running scripts is disabled," run this once, then retry:
        <div className="mt-2"><Code language="bash">Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned</Code></div>
      </Callout>

      <h3>macOS / Linux:</h3>
      <Code language="bash">source venv/bin/activate</Code>

      <Callout kind="check" title="Checkpoint">
        Your terminal prompt should now start with <code>(venv)</code>. That means the sandbox is active.
      </Callout>

      {/* Step 5 */}
      <h2>5. Install Taichi (and friends)</h2>
      <p>
        Taichi is what makes this workshop possible — it lets us run physics on your GPU directly from Python.
        With the venv still active:
      </p>
      <Code language="bash">{`pip install --upgrade pip
pip install taichi numpy`}</Code>
      <p>This downloads ~200 MB. Be patient.</p>

      <Callout kind="check" title="Checkpoint">
        Run this:
        <div className="mt-2"><Code language="bash">python -c "import taichi as ti; ti.init(); print('taichi works')"</Code></div>
        You should see some startup output and then <code>taichi works</code>. If you see <em>"GPU not available, falling back to CPU"</em> — that's fine. You can still complete the workshop.
      </Callout>

      {/* Step 6 */}
      <h2>6. Open your project in VS Code</h2>
      <p>In your terminal (inside the <code>blackhole</code> folder, venv active):</p>
      <Code language="bash">code .</Code>
      <p>VS Code opens. In the bottom-right, click the Python version selector and pick the one with <code>venv</code> in the path. That tells VS Code to use your sandbox.</p>

      <Callout kind="check" title="Final checkpoint">
        Create a new file <code>hello.py</code>, paste this in:
        <div className="mt-2">
          <Code language="python">{`import taichi as ti
ti.init()
print("ready to simulate the impossible")`}</Code>
        </div>
        Hit the ▶ Run button (top-right). You should see your message print at the bottom. If it works — you are 100% ready for Sunday.
      </Callout>

      {/* Troubleshooting */}
      <h2>Common errors</h2>
      <div className="space-y-3 text-sm">
        <div className="rounded-lg border border-white/10 p-3">
          <div className="font-semibold">"python: command not found"</div>
          <div className="text-ink/85">
            On Windows: reinstall Python and tick "Add to PATH." On Mac: try <code>python3</code> instead of <code>python</code>.
          </div>
        </div>
        <div className="rounded-lg border border-white/10 p-3">
          <div className="font-semibold">"pip: command not found"</div>
          <div className="text-ink/85">Run <code>python -m pip install ...</code> instead of just <code>pip install ...</code>.</div>
        </div>
        <div className="rounded-lg border border-white/10 p-3">
          <div className="font-semibold">Taichi says "no GPU found"</div>
          <div className="text-ink/85">Fine — it falls back to CPU. Your sim will be slower but still works. The black hole won't be 60 FPS, more like 15-30. Still beautiful.</div>
        </div>
        <div className="rounded-lg border border-white/10 p-3">
          <div className="font-semibold">PowerShell "script execution disabled"</div>
          <div className="text-ink/85">See step 4 above — run the <code>Set-ExecutionPolicy</code> command.</div>
        </div>
        <div className="rounded-lg border border-white/10 p-3">
          <div className="font-semibold">Everything is on fire</div>
          <div className="text-ink/85">
            Take a screenshot. Drop it in the <Link href="/chat" className="text-accent">chat</Link>. Someone will reply within an
            hour — usually faster.
          </div>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link href="/workshop" className="px-5 py-2.5 rounded-md bg-accent text-black font-semibold inline-block">
          Setup done → continue to the workshop →
        </Link>
      </div>
    </div>
  );
}
