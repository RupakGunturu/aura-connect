import { useMemo, memo, useRef } from "react";
import { Pin } from "lucide-react";
import { Virtuoso } from "react-virtuoso";
import MessageBubble from "./MessageBubble";

const MessageList = memo(function MessageList({ messages, currentUserId, participants, decryptMessage, decryptAttachment, onReply, onDelete, isSearching, pinnedMessages, onPin, onForward, onLoadOlder, hasMore, loadingMore }) {
  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [messages],
  );

  const pinnedIds = useMemo(
    () => new Set(pinnedMessages?.map((p) => p.messageId?._id || p.messageId) ?? []),
    [pinnedMessages],
  );

  const virtuosoRef = useRef(null);

  if (sortedMessages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-12 text-sm text-muted-foreground">
        {isSearching ? "No messages match your search" : "No messages yet. Say hello!"}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {pinnedMessages?.length > 0 && (
        <div className="shrink-0 border-b border-border bg-card/50 px-4 py-3">
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
      <div className="flex-1">
        <Virtuoso
          ref={virtuosoRef}
          data={sortedMessages}
          className="h-full"
          followOutput="smooth"
          startReached={onLoadOlder}
          components={{
            Header: () => hasMore ? (
              <div className="flex justify-center py-3">
                <button
                  onClick={onLoadOlder}
                  disabled={loadingMore}
                  className="rounded-full border border-border bg-card px-4 py-1.5 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {loadingMore ? "Loading…" : "Load older messages"}
                </button>
              </div>
            ) : null,
            Footer: () => <div style={{ height: 8 }} />,
          }}
          itemContent={(index, msg) => {
            const isOwn = msg.senderId === currentUserId;
            const senderId = typeof msg.senderId === "string" ? msg.senderId : msg.senderId?._id;
            const sender = participants?.find((p) => (p._id ?? p.id) === senderId);
            return (
              <div style={{ padding: "1px 16px" }}>
                <MessageBubble
                  message={msg}
                  isOwn={isOwn}
                  sender={sender}
                  decryptMessage={decryptMessage}
                  decryptAttachment={decryptAttachment}
                  onReply={onReply}
                  onDelete={onDelete}
                  onPin={onPin}
                  isPinned={pinnedIds.has(msg._id)}
                  onForward={onForward}
                />
              </div>
            );
          }}
        />
      </div>
    </div>
  );
});

export default MessageList;
