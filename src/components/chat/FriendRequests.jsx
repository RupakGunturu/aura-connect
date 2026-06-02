import { useState, useEffect } from "react";
import { Check, X, UserPlus, UserMinus, ArrowLeft, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function FriendRequests({ onBack }) {
  const { token, user } = useAuth();
  const [tab, setTab] = useState("requests");
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [incomingRes, outgoingRes, friendsRes] = await Promise.allSettled([
      api("/friends/incoming", { token }),
      api("/friends/outgoing", { token }),
      api("/friends", { token }),
    ]);
    if (incomingRes.status === "fulfilled") setIncoming(incomingRes.value.requests ?? []);
    if (outgoingRes.status === "fulfilled") setOutgoing(outgoingRes.value.requests ?? []);
    if (friendsRes.status === "fulfilled") setFriends(friendsRes.value.friends ?? []);
    setLoading(false);
  }

  async function handleAccept(requestId) {
    await api(`/friends/request/${requestId}/accept`, { method: "PATCH", token });
    loadAll();
  }

  async function handleReject(requestId) {
    await api(`/friends/request/${requestId}/reject`, { method: "PATCH", token });
    loadAll();
  }

  async function handleRemove(friendId) {
    await api(`/friends/${friendId}`, { method: "DELETE", token });
    loadAll();
  }

  function AvatarImg({ src, name }) {
    if (src) {
      return <img src={src} alt="" className="size-9 shrink-0 rounded-full object-cover ring-1 ring-border" />;
    }
    return (
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-card text-xs font-semibold uppercase ring-1 ring-border">
        {name?.slice(0, 2) ?? "?"}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <button onClick={onBack} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-card/60">
          <ArrowLeft className="size-4" />
        </button>
        <h2 className="text-sm font-semibold">Friends</h2>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("requests")}
          className={`flex-1 py-2 text-center text-xs font-medium transition-colors ${
            tab === "requests" ? "border-b-2 border-brand text-brand" : "text-muted-foreground"
          }`}
        >
          Requests {incoming.length > 0 && `(${incoming.length})`}
        </button>
        <button
          onClick={() => setTab("friends")}
          className={`flex-1 py-2 text-center text-xs font-medium transition-colors ${
            tab === "friends" ? "border-b-2 border-brand text-brand" : "text-muted-foreground"
          }`}
        >
          Friends ({friends.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : tab === "requests" ? (
          <>
            {incoming.length === 0 && outgoing.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No pending requests</p>
            ) : (
              <>
                {incoming.map((r) => (
                  <div key={r._id} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                    <AvatarImg src={r.sender?.profile?.avatarUrl} name={r.sender?.profile?.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.sender?.profile?.name ?? "Unknown"}</p>
                      <p className="truncate text-xs text-muted-foreground">@{r.sender?.profile?.handle}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAccept(r._id)}
                        className="grid size-8 place-items-center rounded-lg bg-brand text-brand-foreground hover:opacity-80"
                        title="Accept"
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        onClick={() => handleReject(r._id)}
                        className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-card/60 hover:text-foreground"
                        title="Reject"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {outgoing.map((r) => (
                  <div key={r._id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 opacity-60">
                    <AvatarImg src={r.recipient?.profile?.avatarUrl} name={r.recipient?.profile?.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.recipient?.profile?.name ?? "Unknown"}</p>
                      <p className="truncate text-xs text-muted-foreground">Request sent</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Pending</span>
                  </div>
                ))}
              </>
            )}
          </>
        ) : (
          <>
            {friends.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No friends yet</p>
            ) : (
              friends.map((f) => (
                <div key={f._id} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                    <AvatarImg src={f.profile?.avatarUrl} name={f.profile?.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{f.profile?.name ?? "Unknown"}</p>
                    <p className="truncate text-xs text-muted-foreground">@{f.profile?.handle}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(f._id)}
                    className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:text-destructive"
                    title="Remove friend"
                  >
                    <UserMinus className="size-4" />
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
