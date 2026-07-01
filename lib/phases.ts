// ponytail: hard-coded for 2 phases. Bump to add more; SQL check allows up to 3.
export const PHASES = [
  {
    n: 1,
    slug: "setup-check",
    title: "Setup verified",
    blurb:
      "Prove Python, Git, and Antigravity are installed. One screenshot showing the version output does it.",
    howTo: [
      "Open Antigravity. Open the terminal panel at the bottom (View → Terminal, or the shortcut Ctrl+`).",
      "Paste this and hit Enter: python --version && git --version",
      "You should see two version lines, e.g. Python 3.12.x and git version 2.xx.x.",
      "Screenshot the terminal output. Upload it below.",
    ],
  },
  {
    n: 2,
    slug: "first-sim",
    title: "First sim + pushed to GitHub",
    blurb:
      "You got a working sim from Antigravity + master prompt, and you pushed the folder to a public GitHub repo. Paste the repo link.",
    howTo: [
      "Open Antigravity, open your project folder, and use the master prompt + an idea from the Build page.",
      "Iterate until a window opens with a running simulation. Screenshot the window.",
      "Go to github.com → New repository → Public. Copy the HTTPS URL it shows.",
      "In Antigravity's chat, paste: 'commit this folder and push it to <your-repo-url>'. Approve every button it shows.",
      "Open the repo on GitHub in your browser to check your files landed. Paste the repo URL below along with the screenshot.",
    ],
  },
] as const;

export type Phase = (typeof PHASES)[number];

export function phaseByNumber(n: number): Phase | undefined {
  return PHASES.find((p) => p.n === n);
}
