import { memo, useRef } from "react";
import { Virtuoso } from "react-virtuoso";
import MessageBubble from "./MessageBubble";

const MessageList = memo(function MessageList({ messages, currentUserId, participants, decryptMessage, decryptAttachment, onDelete, onDeleteForever, isSearching, onLoadOlder, hasMore, loadingMore }) {
  const virtuosoRef = useRef(null);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-12 text-sm text-muted-foreground">
        {isSearching ? "No messages match your search" : "No messages yet. Say hello!"}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <Virtuoso
          ref={virtuosoRef}
          data={messages}
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
                  onDelete={onDelete}
                  onDeleteForever={onDeleteForever}
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
