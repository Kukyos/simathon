"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// ponytail: localStorage scratchpad. Move to DB if we ever need cross-device resume.
export default function LastVisitedTracker() {
  const path = usePathname();
  useEffect(() => {
    if (!path || path === "/" || path.startsWith("/login") || path.startsWith("/auth")) return;
    try {
      localStorage.setItem("simathon:last", path);
    } catch {
      /* private mode etc */
    }
  }, [path]);
  return null;
}
