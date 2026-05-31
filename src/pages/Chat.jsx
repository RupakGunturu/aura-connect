import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Search, Send, ArrowLeft, MessageCircle, UserPlus, Phone, Video } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCall } from "@/contexts/CallContext";
import { connectSocket, disconnectSocket } from "@/lib/socket";

export default function Chat() {
  const { user, token } = useAuth();
  const { startCall } = useCall();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const s = connectSocket(token);
    return () => {
      s.emit("offline");
      disconnectSocket();
    };
  }, [token]);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    function onMessage(msg) {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
      setConversations((prev) => {
        const existing = prev.find((c) => c._id === msg.conversationId);
        if (existing) {
          return prev.map((c) =>
            c._id === msg.conversationId ? { ...c, lastMessage: msg } : c,
          );
        }
        return prev;
      });
    }
    const s = connectSocket(token);
    s.on("message", onMessage);
    return () => s.off("message", onMessage);
  }, [conversationId, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function loadConversations() {
    try {
      const data = await api("/conversations", { token });
      setConversations(data.conversations ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(id) {
    try {
      const data = await api(`/messages/${id}`, { token });
      setMessages(data.messages ?? []);
    } catch {
      setMessages([]);
    }
  }

  async function handleSearch(q) {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await api(`/users/search?q=${encodeURIComponent(q)}`, { token });
      setSearchResults(data.users ?? []);
    } catch {
      setSearchResults([]);
    }
  }

  async function startConversation(targetUserId) {
    try {
      const data = await api("/conversations", {
        method: "POST",
        body: JSON.stringify({ participants: [user.id, targetUserId] }),
        token,
      });
      setShowSearch(false);
      setSearchQuery("");
      setSearchResults([]);
      loadConversations();
      navigate(`/chat/${data.conversation._id}`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!body.trim() || !conversationId) return;
    try {
      await api("/messages", {
        method: "POST",
        body: JSON.stringify({ conversationId, body: body.trim() }),
        token,
      });
      setBody("");
    } catch (err) {
      toast.error(err.message);
    }
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function otherParticipant(conversation) {
    return conversation.participants?.find((p) => p._id !== user?.id) ?? conversation.participants?.[0];
  }

  const activeConversation = conversations.find((c) => c._id === conversationId);

  return (
    <div className="flex h-full w-full">
      {/* Conversation list */}
      <div className={`flex shrink-0 flex-col border-r border-border ${
        conversationId ? "hidden md:flex md:w-80" : "w-full md:w-80"
      }`}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Messages</h2>
          <button
            onClick={() => setShowSearch((v) => !v)}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-card/60 hover:text-foreground"
          >
            {showSearch ? <ArrowLeft className="size-4" /> : <UserPlus className="size-4" />}
          </button>
        </div>

        {showSearch && (
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by handle or email..."
                className="w-full rounded-xl border border-border bg-background/50 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-brand"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {searchResults.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => startConversation(u._id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-card/60"
                  >
                    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-card text-xs font-semibold uppercase ring-1 ring-border">
                      {u.profile.handle.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{u.profile.name}</p>
                      <p className="truncate text-xs text-muted-foreground">@{u.profile.handle}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
              <MessageCircle className="mb-2 size-8" />
              <p>No conversations yet</p>
              <p className="text-xs">Search for someone to chat with</p>
            </div>
          ) : (
            conversations.map((c) => {
              const other = otherParticipant(c);
              return (
                <button
                  key={c._id}
                  onClick={() => navigate(`/chat/${c._id}`)}
                  className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-card/30 ${
                    c._id === conversationId ? "bg-card/50" : ""
                  }`}
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-card text-sm font-semibold uppercase ring-1 ring-border">
                    {other?.profile?.handle?.slice(0, 2) ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{other?.profile?.name ?? "Unknown"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{other?.profile?.handle ?? "—"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message thread */}
      <div className={`flex flex-1 flex-col ${conversationId ? "" : "hidden md:flex"}`}>
        {conversationId ? (
          <>
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <button
                onClick={() => navigate("/chat")}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-card/60 hover:text-foreground md:hidden"
              >
                <ArrowLeft className="size-4" />
              </button>
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-card text-xs font-semibold uppercase ring-1 ring-border">
                {otherParticipant(activeConversation)?.profile?.handle?.slice(0, 2) ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {otherParticipant(activeConversation)?.profile?.name ?? "Conversation"}
                </p>
              </div>
              <div className="flex gap-1">
                {(() => {
                  const peer = otherParticipant(activeConversation);
                  const peerId = peer?._id;
                  const peerName = peer?.profile?.name;
                  return (
                    <>
                      <button
                        onClick={() => startCall(peerId, "voice", peerName)}
                        className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-card/60 hover:text-foreground"
                        title="Voice call"
                      >
                        <Phone className="size-4" />
                      </button>
                      <button
                        onClick={() => startCall(peerId, "video", peerName)}
                        className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-card/60 hover:text-foreground"
                        title="Video call"
                      >
                        <Video className="size-4" />
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  No messages yet. Say hello!
                </div>
              ) : (
                <div className="space-y-3">
                  {[...messages].reverse().map((msg) => {
                    const isOwn = msg.senderId === user?.id;
                    return (
                      <div key={msg._id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                            isOwn
                              ? "bg-brand text-brand-foreground"
                              : "bg-card text-foreground ring-1 ring-border"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                          <p className={`mt-0.5 text-right text-[10px] ${isOwn ? "text-brand-foreground/60" : "text-muted-foreground"}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-border px-4 py-3">
              <input
                type="text"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type a message..."
                maxLength={4000}
                className="flex-1 rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand"
              />
              <button
                type="submit"
                disabled={!body.trim()}
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground disabled:opacity-50"
              >
                <Send className="size-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center max-md:hidden">
            <MessageCircle className="mb-4 size-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
