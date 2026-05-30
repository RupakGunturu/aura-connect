import { createFileRoute, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Send, Paperclip, Search, Plus, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { messageSchema } from "@/lib/schemas";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatLayout,
});

function ChatLayout() {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [presence, setPresence] = useState({});

  useEffect(() => {
    if (!token) return;
    api("/conversations", { token })
      .then((d) => setConversations(d.conversations ?? []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const s = getSocket(token);
    const onPresence = (e) => {
      setPresence((p) => ({ ...p, [e.userId]: e.online }));
    };
    const onNew = (msg) => {
      setConversations((prev) => {
        const found = prev.find((c) => c.id === msg.conversationId);
        if (!found) return prev;
        const updated = { ...found, lastMessage: { body: msg.body, createdAt: msg.createdAt } };
        return [updated, ...prev.filter((c) => c.id !== msg.conversationId)];
      });
    };
    s.on("presence:update", onPresence);
    s.on("message:new", onNew);
    return () => {
      s.off("presence:update", onPresence);
      s.off("message:new", onNew);
    };
  }, [token]);

  async function startNewConversation() {
    const handle = window.prompt("Handle to start a conversation with:");
    if (!handle) return;
    try {
      const data = await api("/conversations", {
        method: "POST",
        token,
        body: JSON.stringify({ handle: handle.trim().toLowerCase() }),
      });
      setConversations((prev) => {
        if (prev.some((c) => c.id === data.conversation.id)) return prev;
        return [data.conversation, ...prev];
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start conversation");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.peer.handle.includes(q));
  }, [conversations, search]);

  return (
    <>
      {/* Conversations sidebar */}
      <aside className="hidden w-80 shrink-0 flex-col border-r border-border bg-background/30 md:flex">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-base font-semibold tracking-tight">Conversations</h2>
          <button
            onClick={startNewConversation}
            className="grid size-8 place-items-center rounded-full bg-card text-muted-foreground ring-1 ring-border hover:bg-card/80 hover:text-foreground"
            title="New conversation"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card/40 px-3 py-2">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading ? (
            <p className="px-4 py-6 text-xs text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">No conversations yet.</p>
              <button
                onClick={startNewConversation}
                className="mt-3 text-xs font-semibold text-brand hover:underline"
              >
                Start one →
              </button>
            </div>
          ) : (
            filtered.map((c) => (
              <ConversationRow
                key={c.id}
                conversation={c}
                online={presence[c.peer.id] ?? c.peer.online ?? false}
              />
            ))
          )}
        </div>
        <div className="border-t border-border px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          @{user?.handle}
        </div>
      </aside>

      {/* Thread area */}
      <section className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </section>
    </>
  );
}

function ConversationRow({ conversation, online }) {
  const { conversationId } = useParams({ strict: false });
  const active = conversationId === conversation.id;
  return (
    <a
      href={`/chat/${conversation.id}`}
      className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
        active ? "bg-card/70 ring-1 ring-border" : "hover:bg-card/40"
      }`}
    >
      <div className="relative size-10 shrink-0">
        <AvatarBadge user={conversation.peer} />
        {online && (
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-brand" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">@{conversation.peer.handle}</p>
        <p className="truncate text-xs text-muted-foreground">
          {conversation.lastMessage?.body ?? "Say hi 👋"}
        </p>
      </div>
      {conversation.lastMessage && (
        <span className="text-[10px] text-muted-foreground">
          {formatShortTime(conversation.lastMessage.createdAt)}
        </span>
      )}
    </a>
  );
}

function AvatarBadge({ user }) {
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.handle} className="size-10 rounded-full object-cover" />;
  }
  return (
    <div className="grid size-10 place-items-center rounded-full bg-muted text-xs font-semibold uppercase text-foreground">
      {user.handle.slice(0, 2)}
    </div>
  );
}

export function ChatEmptyState() {
  return (
    <div className="grid flex-1 place-items-center p-10 text-center">
      <div className="max-w-xs">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand/15 ring-1 ring-brand/30">
          <Lock className="size-5 text-brand" />
        </div>
        <h3 className="text-base font-semibold">Pick a conversation</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Every message in Vault is sealed in transit and at rest. Start one from the sidebar.
        </p>
      </div>
    </div>
  );
}

function formatShortTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}


