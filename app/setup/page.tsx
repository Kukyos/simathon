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
        You need two apps: <strong>Python</strong> (the language your simulation runs in) and{" "}
        <strong>Cursor</strong> (an editor with AI built in — this is what makes the workshop work without
        you knowing how to code). Total time: about 10 minutes.
      </p>

      <Callout title="What you're installing, in one line">
        Python runs your simulation. Cursor writes the code for you and runs it. That's the whole stack.
      </Callout>

      {/* Step 1 */}
      <h2>1 · Install Python</h2>
      <ol>
        <li>
          Go to{" "}
          <a href="https://www.python.org/downloads/" target="_blank" rel="noreferrer">
            python.org/downloads
          </a>
          . The site shows a big yellow button. Click it. <strong>You need Python 3.10, 3.11, or 3.12</strong>{" "}
          (Taichi doesn't support 3.13 yet — if the yellow button says 3.13, scroll down a little and grab 3.12 instead).
        </li>
        <li>
          Run the installer that downloads.
          <ul>
            <li>
              <strong>Windows (GUI installer):</strong> on the very first screen, tick the box{" "}
              <strong>"Add python.exe to PATH"</strong>. Then click Install.
            </li>
            <li>
              <strong>Mac / terminal-style installer:</strong> just keep pressing <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-xs">Enter</kbd>{" "}
              through every prompt. The defaults are fine. Don't type "no" to anything unless it asks for your password (then type it).
            </li>
          </ul>
        </li>
        <li>Wait for it to finish. Close the window.</li>
      </ol>

      <MediaSlot src="/guide/python-install.png" caption="screenshot: python installer with 'Add to PATH' ticked" />

      <Callout kind="warn" title="The PATH checkbox matters (Windows only)">
        If you missed it, just run the installer again and tick it this time. Otherwise Cursor won't be
        able to find Python later.
      </Callout>

      {/* Step 2 */}
      <h2>2 · Make a GitHub account</h2>
      <p>
        Cursor's sign-up will ask you to connect a GitHub account. It's free and takes 60 seconds. You'll also
        use this same account if you ever share or publish code later.
      </p>
      <ol>
        <li>
          Go to{" "}
          <a href="https://github.com/signup" target="_blank" rel="noreferrer">
            github.com/signup
          </a>
          . Use your real email — you'll need to click a confirmation link.
        </li>
        <li>Pick a username. Anything works. Pick a password.</li>
        <li>Type the code GitHub emails you. Skip every "personalize your experience" question by clicking Continue or Skip.</li>
        <li>Done. You don't need to do anything else on GitHub.</li>
      </ol>

      <MediaSlot src="/guide/github-signup.png" caption="screenshot: github signup form" />

      <Callout kind="warn" title="Already have GitHub?">
        Skip this step. Just remember your login — Cursor will ask for it in a minute.
      </Callout>

      {/* Step 3 */}
      <h2>3 · Install Cursor</h2>
      <ol>
        <li>
          Go to{" "}
          <a href="https://cursor.com" target="_blank" rel="noreferrer">
            cursor.com
          </a>{" "}
          and click <strong>Download</strong>.
        </li>
        <li>Open the file that downloads, drag it to Applications (Mac) or run the installer (Windows).</li>
        <li>
          Open Cursor. It'll ask you to sign in — pick <strong>Continue with Google</strong> (use your Gmail).
        </li>
        <li>
          It'll then ask to <strong>connect GitHub</strong>. Click yes, log in with the account you just made.
          Approve the permissions screen.
        </li>
        <li>It'll ask about importing VS Code settings — just click "Skip" or "Start Fresh."</li>
      </ol>

      <MediaSlot kind="video" src="/guide/cursor-signin.mp4" caption="screen recording: opening cursor for the first time, signing in with google + github" />

      <Callout kind="check" title="You should now have">
        Python installed (no window — it just sits in the background), and Cursor open in front of you with an empty
        editor view.
      </Callout>

      {/* Step 4 */}
      <h2>4 · Make a folder for your project</h2>
      <ol>
        <li>On your desktop, right-click → New Folder. Name it whatever — <code>my-sim</code>, <code>blackhole</code>, anything.</li>
        <li>In Cursor: top menu → <strong>File → Open Folder</strong> → pick the folder you just made.</li>
        <li>Cursor opens it. The left sidebar will be empty. That's normal.</li>
      </ol>

      <MediaSlot src="/guide/cursor-empty-folder.png" caption="screenshot: empty folder open in cursor" />

      {/* Step 5 */}
      <h2>5 · Let Cursor install Taichi for you</h2>
      <p>
        Taichi is the library that does the heavy lifting — physics on your graphics card. We could install it
        from the terminal, but you don't need to. Cursor can do it for you.
      </p>
      <ol>
        <li>
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-xs">Ctrl</kbd>
          {" + "}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-xs">L</kbd>{" "}
          (Mac: <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-xs">⌘</kbd>
          {" + "}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-xs">L</kbd>) to open the
          AI chat.
        </li>
        <li>
          Paste this exactly:
          <div className="my-2">
            <pre><code>{`Install taichi and numpy for me using pip. Run the install command in the terminal. Then check the install worked by running: python -c "import taichi as ti; ti.init(); print('ok')"`}</code></pre>
          </div>
        </li>
        <li>Press Enter. Cursor opens a terminal at the bottom and runs the commands for you.</li>
        <li>
          Whenever Cursor pops up a button — <strong>Run</strong>, <strong>Accept</strong>, <strong>Allow</strong>,{" "}
          <strong>Keep</strong> — just click it. <strong>Let the AI do its job.</strong> Don't try to read every
          line. Click the buttons, watch what happens.
        </li>
      </ol>

      <Callout kind="check" title="The golden rule with Cursor">
        When in doubt, click the green button. The AI is doing the work — your job is just to approve it.
      </Callout>

      <MediaSlot kind="video" src="/guide/cursor-taichi-install.mp4" caption="screen recording: pasting the install prompt into cursor chat" />

      <Callout kind="check" title="Checkpoint">
        At the bottom of Cursor's terminal you should see lines that end with <code>ok</code>. If you see that, you
        are done with setup. Close Cursor — you're ready for the workshop.
      </Callout>

      {/* Stuck */}
      <h2>If something went wrong</h2>
      <ul>
        <li>
          <strong>Cursor says it can't find Python</strong> — reinstall Python with the "Add to PATH" box ticked, then
          restart Cursor.
        </li>
        <li>
          <strong>Cursor's terminal shows an error during install</strong> — copy the red text, paste it back into the
          Cursor chat, and ask "fix this." It usually fixes itself.
        </li>
        <li>
          <strong>Nothing is working</strong> — take a screenshot. Drop it in{" "}
          <Link href="/chat" className="text-accent">
            chat
          </Link>
          . Someone will respond.
        </li>
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/workshop"
          className="px-4 py-2 rounded-md bg-accent text-black font-bold text-sm shadow-[0_0_24px_-4px_rgba(255,106,61,0.7)] hover:bg-accent/90"
        >
          continue to build →
        </Link>
        <Link
          href="/chat"
          className="px-4 py-2 rounded-md bg-panel border border-white/15 text-ink font-semibold text-sm hover:border-accent/40 hover:bg-panel/80"
        >
          ask in chat
        </Link>
      </div>
    </div>
  );
}
