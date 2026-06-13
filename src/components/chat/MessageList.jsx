import { memo, useRef, useCallback } from "react";
import { Virtuoso } from "react-virtuoso";
import MessageBubble from "./MessageBubble";
import { Skeleton } from "@/components/ui/skeleton";

function SkeletonBubble({ isOwn }) {
  return (
    <div className={`flex items-end gap-2 px-4 py-0.5 ${isOwn ? "flex-row-reverse" : ""}`}>
      {!isOwn && <Skeleton className="size-[30px] shrink-0 rounded-full" />}
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <Skeleton
          className={`h-10 ${isOwn ? "rounded-[18px_4px_18px_18px]" : "rounded-[4px_18px_18px_18px]"} w-48 sm:w-64`}
        />
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-1 flex-col gap-2 py-4">
      <SkeletonBubble isOwn={false} />
      <div className="pl-[54px]">
        <Skeleton className="h-10 rounded-[4px_18px_18px_18px] w-56 sm:w-72" />
      </div>
      <div className="pt-6">
        <SkeletonBubble isOwn={true} />
      </div>
      <SkeletonBubble isOwn={true} />
      <div className="pl-[54px] pt-4">
        <Skeleton className="h-10 rounded-[4px_18px_18px_18px] w-40 sm:w-56" />
      </div>
      <SkeletonBubble isOwn={false} />
      <div className="pt-6">
        <SkeletonBubble isOwn={true} />
      </div>
      <SkeletonBubble isOwn={false} />
    </div>
  );
}

function LoaderSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <Skeleton className="size-[30px] shrink-0 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-8 w-3/4 rounded-[4px_18px_18px_18px]" />
      </div>
    </div>
  );
}

const MessageList = memo(function MessageList({
  messages, currentUserId, participants, decryptMessage, decryptAttachment,
  onDelete, onDeleteForever, isSearching, onLoadOlder, hasMore, loadingMore,
  initialLoading,
}) {
  const virtuosoRef = useRef(null);
  const loadingRef = useRef(false);

  const handleStartReached = useCallback(() => {
    if (loadingRef.current || loadingMore || !hasMore) return;
    loadingRef.current = true;
    onLoadOlder();
    loadingRef.current = false;
  }, [loadingMore, hasMore, onLoadOlder]);

  if (initialLoading) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <SkeletonList />
      </div>
    );
  }

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
          startReached={handleStartReached}
          components={{
            Header: () => loadingMore ? (
              <div className="py-2">
                <LoaderSkeleton />
                <LoaderSkeleton />
              </div>
            ) : hasMore ? (
              <div className="flex justify-center py-3">
                <button
                  onClick={onLoadOlder}
                  className="rounded-full border border-border bg-card px-4 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Load older messages
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
