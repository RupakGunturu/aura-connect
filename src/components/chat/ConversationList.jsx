import { MessageCircle, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { useState } from "react";

function Avatar({ user, size = "md" }) {
  const [imgError, setImgError] = useState(false);
  const sizeMap = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-12 text-base" };
  const avatarUrl = user?.profile?.avatarUrl;
  const handle = user?.profile?.handle ?? "?";
  const cls = `grid shrink-0 place-items-center rounded-full bg-card font-semibold uppercase ring-1 ring-border ${sizeMap[size]}`;
  if (avatarUrl && !imgError) {
    return <img src={avatarUrl} alt={handle} className={`${cls} object-cover`} onError={() => setImgError(true)} />;
  }
  return <div className={cls}>{handle.slice(0, 2)}</div>;
}

function LastMessagePreview({ message }) {
  if (!message) return <span className="text-xs text-muted-foreground">No messages yet</span>;
  const text = message.encryptedPayload ? "🔒 Encrypted message" : message.body || "Attachment";
  return <span className="truncate text-xs text-muted-foreground">{text}</span>;
}

export default function ConversationList({
  conversations,
  activeId,
  currentUserId,
  onlineUsers,
  unreadCounts,
  onSelect,
  loading,
}) {
  return (
    <div className="flex shrink-0 flex-col border-r border-border w-full md:w-80">
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-1 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl p-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
            <MessageCircle className="mb-2 size-8" />
            <p>No conversations yet</p>
            <p className="text-xs">Search for someone to chat with</p>
          </div>
        ) : (
          conversations.map((c) => {
            const other = c.participants?.find((p) => p._id !== (currentUserId ?? activeId)) ?? c.participants?.[0];
            const isOnline = onlineUsers.has(other?._id);
            const unread = unreadCounts[c._id] || 0;
            return (
              <button
                key={c._id}
                onClick={() => onSelect(c._id)}
                className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-card/30 ${
                  c._id === activeId ? "bg-card/50" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar user={other} />
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-background bg-green-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      {other?.profile?.name ?? "Unknown"}
                    </p>
                    {c.lastMessage && (
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {new Date(c.lastMessage.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <LastMessagePreview message={c.lastMessage} />
                    {unread > 0 && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-brand-foreground">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export { Avatar };
