"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// ponytail: dumb router.refresh poll. Swap to supabase realtime subscription if traffic justifies.
export default function AutoRefresh({ ms = 15000 }: { ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), ms);
    return () => clearInterval(id);
  }, [router, ms]);
  return null;
}
