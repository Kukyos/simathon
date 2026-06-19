"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Message = {
  id: number;
  user_email: string;
  display_name: string | null;
  content: string;
  is_admin: boolean | null;
  created_at: string;
};

const RATE_LIMIT_MS = 5000;

export default function ChatRoom({
  userEmail,
  displayName,
  isAdmin,
  initialMessages,
}: {
  userEmail: string;
  displayName: string;
  isAdmin: boolean;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSentRef = useRef<number>(0);
  const supabase = supabaseBrowser();

  useEffect(() => {
    const channel = supabase
      .channel("messages-room")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((m) => {
            if (m.some((x) => x.id === incoming.id)) return m;
            // If this is the realtime echo of our own optimistic message, swap the temp row
            // (negative id, same email + content) for the real one. Otherwise just append.
            const tempIdx = m.findIndex(
              (x) =>
                x.id < 0 &&
                x.user_email.toLowerCase() === incoming.user_email.toLowerCase() &&
                x.content === incoming.content,
            );
            if (tempIdx >= 0) {
              const copy = m.slice();
              copy[tempIdx] = incoming;
              return copy;
            }
            return [...m, incoming];
          });
        },
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") console.warn("[chat] realtime status:", status);
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Live cooldown tick.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      const remain = RATE_LIMIT_MS - (Date.now() - lastSentRef.current);
      setCooldown(remain > 0 ? remain : 0);
    }, 250);
    return () => clearInterval(id);
  }, [cooldown]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;

    if (!isAdmin) {
      const since = Date.now() - lastSentRef.current;
      if (since < RATE_LIMIT_MS) {
        setErr(`hang on, ${Math.ceil((RATE_LIMIT_MS - since) / 1000)}s left`);
        return;
      }
    }

    setSending(true);
    setErr(null);
    setInput("");

    // Direct insert — RLS allows authenticated. Returns the inserted row so we can
    // append the real id and confirm persistence. No optimistic flicker.
    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({
        user_email: userEmail,
        display_name: displayName,
        content,
        is_admin: isAdmin,
      })
      .select("id,user_email,display_name,content,is_admin,created_at")
      .single();

    setSending(false);

    if (error || !inserted) {
      setInput(content);
      console.error("[chat] insert failed:", error);
      setErr(error?.message ?? "couldn't send");
      return;
    }

    // Append immediately (realtime echo will be deduped by id).
    setMessages((m) => (m.some((x) => x.id === inserted.id) ? m : [...m, inserted as Message]));
    if (!isAdmin) {
      lastSentRef.current = Date.now();
      setCooldown(RATE_LIMIT_MS);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-panel/40 overflow-hidden flex flex-col h-[70vh]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-muted">No messages yet. Be the first to ask something.</div>
        )}
        {messages.map((m) => {
          const mine = m.user_email.toLowerCase() === userEmail;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  mine
                    ? "bg-accent/15 border border-accent/30"
                    : m.is_admin
                      ? "bg-violet-500/10 border border-violet-400/40 shadow-[0_0_18px_-2px_rgba(167,139,250,0.45)]"
                      : "bg-white/5 border border-white/10"
                }`}
              >
                <div className="text-xs text-muted mb-0.5 flex items-center gap-1.5">
                  <span className={m.is_admin ? "text-violet-300 font-semibold" : ""}>
                    {m.display_name || m.user_email.split("@")[0]}
                  </span>
                  {m.is_admin && (
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/25 border border-violet-400/40 text-violet-200 shadow-[0_0_10px_-2px_rgba(167,139,250,0.6)]">
                      admin
                    </span>
                  )}
                  <span>·</span>
                  <span>
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={send} className="border-t border-white/10 p-3 flex gap-2 items-center">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={cooldown > 0 ? `wait ${Math.ceil(cooldown / 1000)}s…` : "ask anything…"}
          className="flex-1 rounded-md bg-bg border border-white/10 px-3 py-2 focus:outline-none focus:border-accent text-sm disabled:opacity-60"
          maxLength={2000}
          disabled={cooldown > 0}
        />
        <button
          type="submit"
          disabled={sending || !input.trim() || cooldown > 0}
          className="px-4 py-2 rounded-md bg-accent text-black font-semibold text-sm disabled:opacity-50"
        >
          {cooldown > 0 ? `${Math.ceil(cooldown / 1000)}s` : "send"}
        </button>
      </form>
      {err && (
        <div className="mx-3 mb-3 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {err}
        </div>
      )}
    </div>
  );
}
