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

// ponytail: replies are a quote line baked into the message text ("> name: snippet"),
// no DB column, no migration. Upgrade to a reply_to_id column if threads ever matter.
const QUOTE_RE = /^> (.{1,200}?): (.*)\n/;

function splitQuote(content: string): { quote: { name: string; text: string } | null; body: string } {
  const m = content.match(QUOTE_RE);
  if (!m) return { quote: null, body: content };
  return { quote: { name: m[1], text: m[2] }, body: content.slice(m[0].length) };
}

export default function ChatRoom({
  userEmail,
  displayName,
  isAdmin,
  locked = false,
  initialMessages,
}: {
  userEmail: string;
  displayName: string;
  isAdmin: boolean;
  locked?: boolean;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<{ name: string; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
        { event: "DELETE", schema: "public", table: "messages" },
        (payload) => {
          const oldId = (payload.old as { id?: number }).id;
          if (oldId != null) setMessages((m) => m.filter((x) => x.id !== oldId));
        },
      )
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
    const body = input.trim();
    if (!body) return;
    const content = replyTo ? `> ${replyTo.name}: ${replyTo.text}\n${body}` : body;

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
      setInput(body);
      console.error("[chat] insert failed:", error);
      setErr(
        error?.message?.includes("chat_locked")
          ? "chat is locked by the admins right now"
          : error?.message ?? "couldn't send",
      );
      return;
    }

    // Append immediately (realtime echo will be deduped by id).
    setMessages((m) => (m.some((x) => x.id === inserted.id) ? m : [...m, inserted as Message]));
    setReplyTo(null);
    if (!isAdmin) {
      lastSentRef.current = Date.now();
      setCooldown(RATE_LIMIT_MS);
    }
  }

  async function deleteOne(id: number) {
    setMessages((m) => m.filter((x) => x.id !== id)); // optimistic
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) {
      console.error("[chat] delete failed:", error);
      setErr(error.message);
    }
  }

  async function clearAll() {
    if (!confirm("Wipe every message in the chat?")) return;
    setMessages([]);
    // ponytail: delete all rows. .gt(id,0) since supabase requires a filter.
    const { error } = await supabase.from("messages").delete().gt("id", 0);
    if (error) {
      console.error("[chat] clear failed:", error);
      setErr(error.message);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-panel/40 overflow-hidden flex flex-col h-[70vh]">
      {isAdmin && messages.length > 0 && (
        <div className="border-b border-white/10 px-3 py-2 flex justify-end">
          <button
            onClick={clearAll}
            className="text-xs px-2 py-1 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10"
          >
            clear chat
          </button>
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-muted">No messages yet. Be the first to ask something.</div>
        )}
        {messages.map((m) => {
          const mine = m.user_email.toLowerCase() === userEmail;
          const { quote, body } = splitQuote(m.content);
          const startReply = () => {
            setReplyTo({
              name: m.display_name || m.user_email.split("@")[0],
              text: body.length > 90 ? body.slice(0, 90) + "…" : body,
            });
            inputRef.current?.focus();
          };
          return (
            <div key={m.id} className={`group flex items-start gap-2 ${mine ? "justify-end" : "justify-start"}`}>
              {mine && (
                <div className="opacity-0 group-hover:opacity-100 transition flex gap-2 mt-2">
                  {isAdmin && (
                    <button
                      onClick={() => deleteOne(m.id)}
                      className="text-xs text-red-300 hover:text-red-200"
                      title="delete"
                    >
                      ✕
                    </button>
                  )}
                  <button onClick={startReply} className="text-xs text-muted hover:text-accent" title="reply">
                    ↩
                  </button>
                </div>
              )}
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
                {quote && (
                  <div className="mb-1 rounded border-l-2 border-accent/50 bg-black/20 px-2 py-1 text-xs text-ink/60">
                    <span className="font-semibold text-ink/75">{quote.name}</span> {quote.text}
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap break-words">{body}</div>
              </div>
              {!mine && (
                <div className="opacity-0 group-hover:opacity-100 transition flex gap-2 mt-2">
                  <button onClick={startReply} className="text-xs text-muted hover:text-accent" title="reply">
                    ↩
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => deleteOne(m.id)}
                      className="text-xs text-red-300 hover:text-red-200"
                      title="delete"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {locked && !isAdmin ? (
        <div className="border-t border-white/10 p-3 text-center text-sm text-yellow-200/90 bg-yellow-500/5">
          🔒 Chat is locked by the admins right now. You can still read along.
        </div>
      ) : (
      <div className="border-t border-white/10">
      {replyTo && (
        <div className="px-3 pt-2 flex items-center gap-2 text-xs text-ink/70">
          <span className="border-l-2 border-accent/50 pl-2">
            replying to <span className="font-semibold">{replyTo.name}</span>: {replyTo.text}
          </span>
          <button onClick={() => setReplyTo(null)} className="text-muted hover:text-red-300" title="cancel reply">
            ✕
          </button>
        </div>
      )}
      <form onSubmit={send} className="p-3 flex gap-2 items-center">
        <input
          ref={inputRef}
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
      </div>
      )}
      {err && (
        <div className="mx-3 mb-3 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {err}
        </div>
      )}
    </div>
  );
}
