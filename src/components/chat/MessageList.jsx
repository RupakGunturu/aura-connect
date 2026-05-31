import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function MessageList({ messages, currentUserId, decryptMessage }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-12 text-sm text-muted-foreground">
        No messages yet. Say hello!
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
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
              />
            );
          })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
