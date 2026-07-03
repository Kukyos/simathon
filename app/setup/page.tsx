import Link from "next/link";
import { Callout } from "@/components/Callout";
import MediaSlot from "@/components/MediaSlot";

export const metadata = { title: "Setup · Simathon" };

export default function SetupPage() {
  return (
    <div className="prose-body max-w-3xl mx-auto">
      <div className="text-xs uppercase tracking-[0.2em] text-accent2">01 · before the workshop</div>
      <h1 className="text-3xl font-bold mt-1">Setup</h1>
      <p className="text-ink/80 mt-2 text-[15px]">
        Three installs and one signup. About 15 minutes total. Do this <strong>before</strong> the workshop
        starts — we'll spend the first 5 minutes checking everyone got here. If you show up mid-workshop
        without setup done, you'll be behind for the whole thing.
      </p>

      <Callout title="What you're installing, in one line">
        <strong>Python</strong> runs your sim. <strong>Git</strong> uploads your code to the internet.
        <strong> GitHub</strong> is where the code lives. <strong>Antigravity</strong> is the editor
        with an AI agent that writes the code for you.
      </Callout>

      {/* Step 1 */}
      <h2>1 · Install Python</h2>
      <ol>
        <li>
          Go to{" "}
          <a href="https://www.python.org/downloads/" target="_blank" rel="noreferrer">
            python.org/downloads
          </a>
          . <strong>You need Python 3.10, 3.11, or 3.12</strong> — Taichi doesn't support anything
          newer. The big yellow button gives you 3.13 or 3.14, so <strong>don't click it</strong>:
          scroll down to "Looking for a specific release?" and grab the latest 3.12.
        </li>
        <li>
          Run the installer.
          <ul>
            <li>
              <strong>Windows:</strong> tick <strong>"Add python.exe to PATH"</strong> on the first screen. Then Install.
            </li>
            <li>
              <strong>Mac:</strong> keep clicking <strong>Continue</strong> through the prompts. Defaults are fine.
            </li>
          </ul>
        </li>
      </ol>

      <MediaSlot src="/guide/python.png" caption="screenshot: python installer with 'Add to PATH' ticked" />

      <Callout kind="warn" title="The PATH checkbox matters (Windows only)">
        If you missed it, run the installer again and tick it. Otherwise Antigravity's terminal won't find Python.
      </Callout>

      {/* Step 2 */}
      <h2>2 · Install Git</h2>
      <p>
        Git is the tool that uploads your code to GitHub. Antigravity's AI will run it for you, but only if it's
        already installed on your machine.
      </p>
      <ol>
        <li>
          <strong>Windows:</strong> go to{" "}
          <a href="https://git-scm.com/download/win" target="_blank" rel="noreferrer">
            git-scm.com/download/win
          </a>
          . The download starts automatically. Run the installer and click Next through every screen — the defaults
          are correct (including the credential manager, which does GitHub login for you later).
        </li>
        <li>
          <strong>Mac:</strong> open Terminal (Cmd+Space, type "Terminal", Enter). Paste{" "}
          <code>xcode-select --install</code> and hit Enter. Click Install on the popup. Wait a minute or two.
        </li>
      </ol>

      <Callout kind="check" title="Check Git installed">
        Open a fresh terminal window and type <code>git --version</code>. You should see a line like{" "}
        <code>git version 2.xx.x</code>. If it says "command not found", reinstall and let the installer add Git to PATH.
      </Callout>

      <MediaSlot kind="video" src="https://youtu.be/xdN3YxmbSO8" caption="watch: installing git in under 2 minutes" />

      {/* Step 3 */}
      <h2>3 · Make a GitHub account</h2>
      <p>
        GitHub is where your code goes at the end. Free, 60 seconds. Skip if you already have one — just remember
        the login.
      </p>
      <ol>
        <li>
          Go to{" "}
          <a href="https://github.com/signup" target="_blank" rel="noreferrer">
            github.com/signup
          </a>
          . Use your real email — you'll need the confirmation link.
        </li>
        <li>Pick a username and password.</li>
        <li>Enter the code GitHub emails you. Skip every "personalize your experience" screen.</li>
        <li>
          Stay logged in on your browser — you'll come back here in Phase 2 to create a repo.
        </li>
      </ol>

      <MediaSlot src="/guide/githubsignup.png" caption="screenshot: github signup form" />

      {/* Step 4 */}
      <h2>4 · Install Antigravity</h2>
      <p>
        Antigravity is a code editor with an AI agent built in. You talk to it, it writes code and runs it. That's
        the whole workshop.
      </p>
      <ol>
        <li>
          Go to{" "}
          <a href="https://antigravity.google/" target="_blank" rel="noreferrer">
            antigravity.google
          </a>
          . Click <strong>Download</strong>. Pick the installer that matches your OS.
        </li>
        <li>Run the installer. On Mac, drag it to Applications.</li>
        <li>
          Open Antigravity. When it asks you to sign in, use <strong>Google</strong> (any Gmail). That's the whole
          login — no other accounts, no configuration.
        </li>
        <li>Skip any "import VS Code settings" or tutorial prompts. Just close them.</li>
      </ol>

      <MediaSlot kind="video" src="https://youtu.be/o4IQF9WWa8M" caption="watch: install antigravity + first sign-in" />

      <Callout kind="warn" title="Model picker — start cheap">
        Antigravity's agent runs on multiple AI models with different rate limits and costs. Start with the
        cheapest option that gives sensible answers. If it stops working mid-sim ("rate limited"), switch to a
        stronger one. Don't burn the most expensive model on your first prompt — save it for when you're stuck.
      </Callout>

      <Callout kind="check" title="You should now have">
        Python installed (sits invisibly in the background), Git installed (also invisible), a GitHub account you're
        logged into in your browser, and Antigravity open in front of you.
      </Callout>

      {/* Verify */}
      <h2>5 · Verify (Phase 1 submission)</h2>
      <ol>
        <li>In Antigravity, open the terminal at the bottom (View → Terminal, or <kbd className="kbd">Ctrl</kbd>+<kbd className="kbd">`</kbd>).</li>
        <li>
          Run these two commands, one at a time (on Mac, type <code>python3</code> instead of{" "}
          <code>python</code>):
          <div className="my-2">
            <pre><code>{`python --version
git --version`}</code></pre>
          </div>
        </li>
        <li>
          You should see two version lines — Python starting with <code>3.10</code>, <code>3.11</code>{" "}
          or <code>3.12</code>, and any Git version.
        </li>
        <li>
          Screenshot the terminal. Upload it on{" "}
          <Link href="/phase/1" className="text-accent">
            Phase 1
          </Link>
          . Once an admin approves, you're all clear for the workshop.
        </li>
      </ol>

      <MediaSlot kind="video" src="https://youtu.be/e8p9elH3L-o" caption="watch: verify install + submit Phase 1" />

      <Callout kind="check" title="About Taichi">
        You don't install Taichi now. When we start vibecoding during the workshop, Antigravity's agent will run{" "}
        <code>pip install taichi</code> in your project's terminal on its own. One less thing to worry about.
      </Callout>

      {/* Stuck */}
      <h2>If something went wrong</h2>
      <ul>
        <li>
          <strong>Antigravity says it can't find Python</strong> — reinstall Python with "Add to PATH" ticked,
          then restart Antigravity.
        </li>
        <li>
          <strong><code>git</code> command not found</strong> — reinstall Git; on Windows use the default options.
        </li>
        <li>
          <strong><code>python --version</code> says 3.13 or 3.14</strong> — Taichi won't run on it. Go back to
          step 1 and install 3.12 as well (it can sit next to the newer one).
        </li>
        <li>
          <strong>Terminal shows a red error</strong> — copy the error, paste it into Antigravity's chat, say
          "fix this". It usually can.
        </li>
        <li>
          <strong>Nothing works</strong> — take a screenshot, drop it in{" "}
          <Link href="/chat" className="text-accent">
            chat
          </Link>
          .
        </li>
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/phase/1"
          className="px-4 py-2 rounded-md bg-accent text-black font-bold text-sm shadow-[0_0_24px_-4px_rgba(255,106,61,0.7)] hover:bg-accent/90"
        >
          submit Phase 1 →
        </Link>
        <Link href="/chat" className="btn-ghost">
          ask in chat
        </Link>
      </div>
    </div>
  );
}
