"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const LABELS: Record<string, string> = {
  "/setup": "Setup",
  "/workshop": "Build",
  "/hackathon": "Hackathon",
  "/chat": "Chat",
  "/submit": "Submit",
  "/gallery": "Gallery",
};

export default function ResumePill() {
  const [last, setLast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem("simathon:last");
      if (v && LABELS[v]) setLast(v);
    } catch {
      /* ignore */
    }
  }, []);

  if (!last) return null;
  return (
    <Link
      href={last}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-xs text-ink hover:bg-accent/10 transition"
    >
      <span className="text-muted">continue where you left off</span>
      <span className="text-accent">{LABELS[last]} →</span>
    </Link>
  );
}
