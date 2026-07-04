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
        Welcome! Before the workshop there are three installs and one signup, about 15 minutes total.
        Doing it <strong>before</strong> we start means you spend the workshop building your sim instead
        of watching download bars. And if anything refuses to install, you have plenty of time to ask in
        chat and get it sorted.
      </p>

      <Callout title="What you're installing, in one line each">
        <strong>Python</strong> runs your sim. <strong>Git</strong> uploads your code to the internet.
        <strong> GitHub</strong> is where the code lives so others can see it. <strong>Antigravity</strong> is
        the editor with an AI agent that writes the code for you. That's the whole toolkit.
      </Callout>

      {/* Step 1 */}
      <h2>1 · Install Python</h2>
      <ol>
        <li>
          Go to{" "}
          <a href="https://www.python.org/downloads/" target="_blank" rel="noreferrer">
            python.org/downloads
          </a>
          . <strong>Install Python 3.12 — not the newest one.</strong> Taichi (the graphics library
          we use) only works on Python 3.10, 3.11, or 3.12, and the big yellow download button gives
          you 3.13 or 3.14, which won't work. Instead, scroll down to{" "}
          <strong>"Looking for a specific release?"</strong>, click the newest version that starts
          with <strong>3.12</strong>, and download the installer for your OS from that page.
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

      <MediaSlot src="/guide/python.png" caption="screenshot: the 3.12 row to download on python.org (not the big button)" />

      <Callout kind="warn" title="The PATH checkbox matters (Windows only)">
        If you missed it, run the installer again and tick it. Otherwise Antigravity's terminal won't find Python.
      </Callout>

      {/* Step 2 */}
      <h2>2 · Install Git</h2>
      <p>
        Git is the tool that moves code between your laptop and GitHub (it also keeps a history of every
        change, which is why programmers use it for everything). You won't need to learn any Git commands
        today: Antigravity's AI runs them for you. It just needs Git installed on your machine first.
      </p>
      <ol>
        <li>
          <strong>Windows:</strong> go to{" "}
          <a href="https://git-scm.com/download/win" target="_blank" rel="noreferrer">
            git-scm.com/download/win
          </a>
          . The download starts automatically. Run the installer and click Next through every screen. The defaults
          are all correct, including the credential manager that handles GitHub login for you later.
        </li>
        <li>
          <strong>Mac:</strong> open Terminal (Cmd+Space, type "Terminal", Enter). Paste{" "}
          <code>xcode-select --install</code> and hit Enter. Click Install on the popup. Wait a minute or two.
        </li>
      </ol>

      <p>
        <strong>One last thing: tell Git who you are.</strong> Every upload to GitHub gets stamped with a
        name and email, and Git refuses to work until you've set them. Open a fresh terminal (on Windows,
        search "Git Bash" or "PowerShell" in the Start menu; on Mac, Terminal) and run these two commands,
        with your own name and the <strong>same email you'll use for GitHub</strong>:
      </p>
      <pre><code>{`git config --global user.name "Your Name"
git config --global user.email "you@example.com"`}</code></pre>
      <p>
        Keep the quotes, swap in your details. No output means it worked. This is a one-time thing per
        laptop — you never have to do it again.
      </p>

      <Callout kind="check" title="Check Git installed">
        In that same terminal, type <code>git --version</code>. You should see a line like{" "}
        <code>git version 2.xx.x</code>. If it says "command not found", reinstall and let the installer
        add Git to PATH. Then type <code>git config user.email</code> — it should echo your email back.
      </Callout>

      <MediaSlot kind="video" src="https://youtu.be/xdN3YxmbSO8" caption="watch: installing git in under 2 minutes" />

      {/* Step 3 */}
      <h2>3 · Make a GitHub account</h2>
      <p>
        GitHub is a website where people store and share code. When your sim is done, you'll upload
        (or "push") it there, and that link is what you submit for the hackathon. It's how the judges see
        your code, how other participants can peek at what you built, and honestly a nice thing to have
        beyond this event: every programmer you'll ever meet has a GitHub profile, and yours starts here.
        It's free and takes about a minute. Already have an account? Skip this step, just make sure you
        remember the login.
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

      <Callout kind="warn" title="Save your model limit for when it counts">
        One thing worth knowing before you start: Antigravity's AI agent can run on several different models,
        and each one has a usage limit. The big, smart models (the ones marked "Pro" or "High") have the
        smallest limits. If you use a big model for every little thing, you can run out mid-workshop and get
        stuck waiting for the limit to reset. So here's the play: start on the smallest or "Fast" model in the
        picker. It handles most requests fine. Only switch up to a bigger model when the small one is genuinely
        stuck (same error twice in a row, or output that makes no sense). Think of the big model as your
        emergency budget, not your default.
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
          You should see two version lines: Python starting with <code>3.10</code>, <code>3.11</code>{" "}
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
      <p>Totally normal, setup hiccups happen to everyone. Find your symptom below:</p>
      <ul>
        <li>
          <strong>Antigravity says it can't find Python:</strong> reinstall Python with "Add to PATH" ticked,
          then restart Antigravity.
        </li>
        <li>
          <strong><code>git</code> command not found:</strong> reinstall Git; on Windows use the default options.
        </li>
        <li>
          <strong>Git says "Author identity unknown" or "please tell me who you are":</strong> you skipped
          the two <code>git config</code> commands in step 2. Run them and try again.
        </li>
        <li>
          <strong><code>python --version</code> says 3.13 or 3.14:</strong> Taichi won't run on it. Go back to
          step 1 and install 3.12 as well (it can sit next to the newer one, no conflict).
        </li>
        <li>
          <strong>Terminal shows a red error:</strong> copy the error, paste it into Antigravity's chat, say
          "fix this". It usually can.
        </li>
        <li>
          <strong>None of the above helped:</strong> take a screenshot and drop it in{" "}
          <Link href="/chat" className="text-accent">
            chat
          </Link>
          . Someone will get you unstuck.
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
