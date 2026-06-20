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
          . The site shows a big yellow button with the latest version. Click it.
        </li>
        <li>
          Run the installer that downloads.{" "}
          <strong>On the first screen, check the box that says "Add python.exe to PATH"</strong> (Windows)
          or just keep all defaults (Mac).
        </li>
        <li>Click Install. Wait for it to finish. Close the installer.</li>
      </ol>

      <MediaSlot caption="screenshot: python installer with 'Add to PATH' ticked" />

      <Callout kind="warn" title="The PATH checkbox matters">
        If you missed it on Windows, just run the installer again and tick it this time. Otherwise Cursor won't be
        able to find Python later.
      </Callout>

      {/* Step 2 */}
      <h2>2 · Install Cursor</h2>
      <ol>
        <li>
          Go to{" "}
          <a href="https://cursor.com" target="_blank" rel="noreferrer">
            cursor.com
          </a>{" "}
          and click <strong>Download</strong>.
        </li>
        <li>Open the file that downloads, drag it to Applications (Mac) or run the installer (Windows).</li>
        <li>Open Cursor. It'll ask you to sign in — use Google or GitHub, whichever you have.</li>
        <li>It'll ask about importing VS Code settings — just click "Skip" or "Start Fresh."</li>
      </ol>

      <MediaSlot kind="video" caption="screen recording: opening cursor for the first time" />

      <Callout kind="check" title="You should now have">
        Python installed (no window — it just sits in the background), and Cursor open in front of you with an empty
        editor view.
      </Callout>

      {/* Step 3 */}
      <h2>3 · Make a folder for your project</h2>
      <ol>
        <li>On your desktop, right-click → New Folder. Name it whatever — <code>my-sim</code>, <code>blackhole</code>, anything.</li>
        <li>In Cursor: top menu → <strong>File → Open Folder</strong> → pick the folder you just made.</li>
        <li>Cursor opens it. The left sidebar will be empty. That's normal.</li>
      </ol>

      <MediaSlot caption="screenshot: empty folder open in cursor" />

      {/* Step 4 */}
      <h2>4 · Let Cursor install Taichi for you</h2>
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
          When it asks "Run command?" — click <strong>Run</strong>. Same for any other approval prompts.
        </li>
      </ol>

      <MediaSlot kind="video" caption="screen recording: pasting the install prompt into cursor chat" />

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
