import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Lock, Send, Paperclip, Smile } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { messageSchema } from "@/lib/schemas";

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  status?: "sent" | "delivered" | "read";
};

type Peer = {
  id: string;
  handle: string;
  avatarUrl?: string | null;
  online?: boolean;
  lastSeen?: string | null;
};

export const Route = createFileRoute("/_authenticated/chat/$conversationId")({
  component: ChatThread,
});

function ChatThread() {
  const { conversationId } = Route.useParams();
  const { token, user } = useAuth();
  const [peer, setPeer] = useState<Peer | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [peerTyping, setPeerTyping] = useState(false);
  const [peerOnline, setPeerOnline] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api<{ peer: Peer; messages: Message[] }>(`/conversations/${conversationId}/messages`, { token })
      .then((d) => {
        setPeer(d.peer);
        setMessages(d.messages);
        setPeerOnline(d.peer.online ?? false);
      })
      .catch(() => {
        setMessages([]);
      })
      .finally(() => setLoading(false));
  }, [conversationId, token]);

  useEffect(() => {
    if (!token) return;
    const s = getSocket(token);
    s.emit("conversation:join", { conversationId });

    const onNew = (m: Message) => {
      if (m.conversationId !== conversationId) return;
      setMessages((prev) => [...prev, m]);
      if (m.senderId !== user?.id) {
        s.emit("message:read", { conversationId, messageId: m.id });
      }
    };
    const onStatus = (e: { conversationId: string; messageId: string; status: Message["status"] }) => {
      if (e.conversationId !== conversationId) return;
      setMessages((prev) => prev.map((m) => (m.id === e.messageId ? { ...m, status: e.status } : m)));
    };
    const onTyping = (e: { conversationId: string; userId: string; typing: boolean }) => {
      if (e.conversationId !== conversationId || e.userId === user?.id) return;
      setPeerTyping(e.typing);
    };
    const onPresence = (e: { userId: string; online: boolean }) => {
      if (peer && e.userId === peer.id) setPeerOnline(e.online);
    };

    s.on("message:new", onNew);
    s.on("message:status", onStatus);
    s.on("typing", onTyping);
    s.on("presence:update", onPresence);

    return () => {
      s.emit("conversation:leave", { conversationId });
      s.off("message:new", onNew);
      s.off("message:status", onStatus);
      s.off("typing", onTyping);
      s.off("presence:update", onPresence);
    };
  }, [conversationId, token, user?.id, peer?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, peerTyping]);

  function notifyTyping(typing: boolean) {
    if (!token) return;
    const s = getSocket(token);
    s.emit("typing", { conversationId, typing });
  }

  function handleDraftChange(v: string) {
    setDraft(v);
    notifyTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => notifyTyping(false), 1500);
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const parsed = messageSchema.safeParse({ body: draft.trim() });
    if (!parsed.success || !token) return;
    const body = parsed.data.body;
    setDraft("");
    notifyTyping(false);
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      conversationId,
      senderId: user!.id,
      body,
      createdAt: new Date().toISOString(),
      status: "sent",
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const data = await api<{ message: Message }>(`/conversations/${conversationId}/messages`, {
        method: "POST",
        token,
        body: JSON.stringify({ body }),
      });
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data.message : m)));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(body);
    }
  }

  const grouped = useMemo(() => groupByDay(messages), [messages]);

  if (loading) {
    return <div className="grid flex-1 place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-3">
          {peer && (
            <>
              <div className="relative">
                {peer.avatarUrl ? (
                  <img src={peer.avatarUrl} alt={peer.handle} className="size-9 rounded-full object-cover" />
                ) : (
                  <div className="grid size-9 place-items-center rounded-full bg-muted text-xs font-semibold uppercase">
                    {peer.handle.slice(0, 2)}
                  </div>
                )}
                {peerOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-brand" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">@{peer.handle}</p>
                <p className="text-[10px] text-muted-foreground">
                  {peerOnline ? "online" : peer.lastSeen ? `last seen ${formatShortTime(peer.lastSeen)}` : "offline"}
                </p>
              </div>
            </>
          )}
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
            <Lock className="size-2.5" /> Encrypted
          </span>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {grouped.map((group) => (
            <div key={group.day} className="space-y-4">
              <div className="flex justify-center">
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {group.day}
                </span>
              </div>
              {group.items.map((m) => {
                const mine = m.senderId === user?.id;
                return (
                  <div
                    key={m.id}
                    className={`flex items-end gap-3 animate-in fade-in slide-in-from-bottom-1 ${
                      mine ? "flex-row-reverse" : ""
                    }`}
                  >
                    {!mine && peer && (
                      <div className="size-7 shrink-0 rounded-full bg-muted" />
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        mine
                          ? "bubble-me rounded-tr-none ring-1 ring-brand/15"
                          : "bubble-them rounded-tl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{m.body}</p>
                      <div className={`mt-1 flex items-center gap-1 ${mine ? "justify-end" : ""}`}>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {mine && (
                          <span className="text-[10px] text-brand/80">
                            {m.status === "read" ? "✓✓" : m.status === "delivered" ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {peerTyping && (
            <div className="flex items-end gap-3">
              <div className="size-7 shrink-0 rounded-full bg-muted" />
              <div className="bubble-them rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <form onSubmit={send} className="p-6">
        <div className="mx-auto max-w-2xl">
          <div className="glass-card flex items-center gap-3 rounded-2xl border border-border px-4 py-2.5 shadow-inner">
            <button type="button" className="text-muted-foreground hover:text-foreground" tabIndex={-1}>
              <Paperclip className="size-4" />
            </button>
            <input
              value={draft}
              onChange={(e) => handleDraftChange(e.target.value)}
              placeholder={peer ? `Message @${peer.handle}…` : "Message…"}
              maxLength={4000}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button type="button" className="text-muted-foreground hover:text-foreground" tabIndex={-1}>
              <Smile className="size-4" />
            </button>
            <button
              type="submit"
              disabled={!draft.trim()}
              className="grid size-8 place-items-center rounded-full bg-brand text-brand-foreground transition-transform hover:scale-105 disabled:opacity-40"
            >
              <Send className="size-3.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function groupByDay(msgs: Message[]) {
  const map = new Map<string, Message[]>();
  for (const m of msgs) {
    const day = formatDayLabel(m.createdAt);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(m);
  }
  return Array.from(map.entries()).map(([day, items]) => ({ day, items }));
}

function formatDayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "long", day: "numeric" });
}

function formatShortTime(iso: string) {
  return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
