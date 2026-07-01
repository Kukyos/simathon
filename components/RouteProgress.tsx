"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// ponytail: no nprogress dep. Global click listener flips a boolean on internal
// link clicks; pathname change flips it back. 8s safety timeout so a cancelled
// or rejected navigation can never leave the bar spinning forever.
export default function RouteProgress() {
  const [active, setActive] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as HTMLElement)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      if (href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) return;
      if (a.target === "_blank") return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (href === pathname) return; // same page, no nav
      setActive(true);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  useEffect(() => {
    setActive(false);
  }, [pathname]);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setActive(false), 8000);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div
      aria-hidden
      className={`fixed top-0 left-0 right-0 h-[2px] z-[100] pointer-events-none transition-opacity duration-200 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        key={active ? "on" : "off"}
        className={`h-full bg-accent shadow-[0_0_10px_rgba(255,106,61,0.6)] ${
          active ? "route-progress-run" : ""
        }`}
      />
    </div>
  );
}
