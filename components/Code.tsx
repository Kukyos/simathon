"use client";

import { useState } from "react";

export function Code({ children, language }: { children: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group">
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(children);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        className="absolute right-2 top-2 text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition"
      >
        {copied ? "copied" : "copy"}
      </button>
      {language && (
        <div className="absolute left-3 top-2 text-[10px] uppercase tracking-wider text-muted">{language}</div>
      )}
      <pre className={language ? "pt-7" : ""}><code>{children}</code></pre>
    </div>
  );
}
