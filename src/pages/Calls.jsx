import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  Video,
  Loader,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCall } from "@/contexts/CallContext";

function CallIcon({ session, userId }) {
  const type = session.metadata?.type ?? "voice";
  const isOutgoing =
    session.participants?.[0]?._id === userId || session.participants?.[0]?.id === userId;
  const status = session.status;

  if (type === "video") {
    if (status === "ended")
      return (
        <Video className={`size-4 ${isOutgoing ? "text-muted-foreground" : "text-red-400"}`} />
      );
    return <Video className="size-4 text-green-400" />;
  }

  if (status === "missed" || (status === "ended" && !isOutgoing))
    return <PhoneMissed className="size-4 text-red-400" />;
  if (status === "ended" && isOutgoing)
    return <PhoneOutgoing className="size-4 text-muted-foreground" />;
  if (status === "active") return <Phone className="size-4 text-green-400" />;
  return <Phone className="size-4 text-muted-foreground" />;
}

export default function Calls() {
  const { user, token } = useAuth();
  const { startCall } = useCall();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api("/calls", { token })
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  function otherParticipant(session) {
    return (
      session.participants?.find((p) => (p._id ?? p.id) !== user?.id) ?? session.participants?.[0]
    );
  }

  function duration(session) {
    if (!session.createdAt || !session.updatedAt) return "";
    const ms = new Date(session.updatedAt) - new Date(session.createdAt);
    if (ms < 1000) return "";
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  }

  async function handleCall(otherId, otherName, type, e) {
    e.stopPropagation();
    try {
      await startCall(otherId, type, otherName);
    } catch {
      // permission denied etc.
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Calls</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-4">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="size-8 rounded-full" />
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Phone className="mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium">No calls yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Start a call from any conversation</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sessions.map((s) => {
              const other = otherParticipant(s);
              const otherId = other?._id ?? other?.id;
              return (
                <div
                  key={s._id}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-card/30"
                >
                  <div className="size-10 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
                    {other?.profile?.avatarUrl ? (
                      <img src={other.profile.avatarUrl} alt="" loading="lazy" className="size-full object-cover" />
                    ) : (
                      <div className="grid size-full place-items-center bg-card text-sm font-semibold uppercase">
                        {other?.profile?.handle?.slice(0, 2) ?? "?"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {other?.profile?.name ?? "Unknown"}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                      <CallIcon session={s} userId={user?.id} />
                      <span className={s.status === "missed" || (s.status === "ended" && !(s.participants?.[0]?._id === user?.id || s.participants?.[0]?.id === user?.id)) ? "text-red-400 font-medium" : "text-muted-foreground"}>
                        {s.status === "active"
                          ? "Ongoing"
                          : s.status === "missed" || s.status === "pending"
                            ? "Missed"
                            : s.status === "ended"
                              ? duration(s) || "Ended"
                              : ""}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  {otherId && (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => handleCall(otherId, other?.profile?.name, "voice", e)}
                        className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-card/60 hover:text-foreground"
                        title="Voice call"
                      >
                        <Phone className="size-4" />
                      </button>
                      <button
                        onClick={(e) => handleCall(otherId, other?.profile?.name, "video", e)}
                        className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-card/60 hover:text-foreground"
                        title="Video call"
                      >
                        <Video className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
