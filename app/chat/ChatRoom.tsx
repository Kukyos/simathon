"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Message = {
  id: number;
  user_email: string;
  display_name: string | null;
  content: string;
  created_at: string;
};

export default function ChatRoom({
  userEmail,
  initialMessages,
}: {
  userEmail: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = supabaseBrowser();

  useEffect(() => {
    const channel = supabase
      .channel("messages-room")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((m) => [...m, payload.new as Message]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      user_email: userEmail,
      display_name: userEmail.split("@")[0],
      content,
    });
    setSending(false);
    if (!error) setInput("");
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
              <div className={`max-w-[80%] rounded-lg px-3 py-2 ${mine ? "bg-accent/20 border border-accent/30" : "bg-white/5 border border-white/10"}`}>
                <div className="text-xs text-muted mb-0.5">
                  {m.display_name || m.user_email.split("@")[0]} ·{" "}
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={send} className="border-t border-white/10 p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          className="flex-1 rounded-md bg-bg border border-white/10 px-3 py-2 focus:outline-none focus:border-accent text-sm"
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="px-4 py-2 rounded-md bg-accent text-black font-semibold text-sm disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
