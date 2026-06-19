// ponytail: hard-coded for 2 phases. Bump to add more; SQL check allows up to 3.
export const PHASES = [
  {
    n: 1,
    slug: "setup-check",
    title: "Setup verified",
    blurb:
      "Prove Python, Taichi, and Cursor are installed. We just need to see one screenshot of a working install.",
    howTo: [
      "Open Cursor. Open the terminal panel at the bottom (View → Terminal).",
      'Paste this command and hit Enter: python -c "import taichi as ti; ti.init(); print(\'setup ok\')"',
      "Screenshot the result. The bottom of the output should say setup ok (along with some Taichi startup messages).",
      "Upload the screenshot below.",
    ],
  },
  {
    n: 2,
    slug: "first-sim",
    title: "First sim running",
    blurb:
      "Use the master prompt + an idea from the gallery to generate a working sim. Run it. Screenshot the window.",
    howTo: [
      "Pick an idea from the Build page gallery.",
      "Paste the master prompt + your idea into Cursor's AI chat. Let it generate the code.",
      "Click Run. A simulation window should open.",
      "Screenshot the window (or short video). Upload below.",
    ],
  },
] as const;

export type Phase = (typeof PHASES)[number];

export function phaseByNumber(n: number): Phase | undefined {
  return PHASES.find((p) => p.n === n);
}
