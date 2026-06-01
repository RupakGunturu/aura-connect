import { useEffect, useRef } from "react";
import { Pin } from "lucide-react";
import MessageBubble from "./MessageBubble";

export default function MessageList({ messages, currentUserId, decryptMessage, onReply, onDelete, isSearching, pinnedMessages, onPin, onForward }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-12 text-sm text-muted-foreground">
        {isSearching ? "No messages match your search" : "No messages yet. Say hello!"}
      </div>
    );
  }

  const pinnedIds = new Set(pinnedMessages?.map((p) => p.messageId?._id || p.messageId) ?? []);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {pinnedMessages?.length > 0 && (
        <div className="mb-3 rounded-xl border border-border bg-card/50 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-brand">
            <Pin className="size-3" />
            <span className="font-semibold">Pinned messages</span>
          </div>
          <div className="space-y-1.5">
            {pinnedMessages.map((p) => {
              const msg = p.messageId;
              if (!msg) return null;
              return (
                <div
                  key={msg._id}
                  className="cursor-pointer truncate rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-card"
                  onClick={() => {
                    document.getElementById(`msg-${msg._id}`)?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {msg.body || (msg.encryptedPayload ? "Encrypted message" : "📎 Media")}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="space-y-3">
        {[...messages]
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .map((msg) => {
            const isOwn = msg.senderId === currentUserId;
            return (
              <MessageBubble
                key={msg._id}
                message={msg}
                isOwn={isOwn}
                decryptMessage={decryptMessage}
                onReply={onReply}
                onDelete={onDelete}
                onPin={onPin}
                isPinned={pinnedIds.has(msg._id)}
                onForward={onForward}
              />
            );
          })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
