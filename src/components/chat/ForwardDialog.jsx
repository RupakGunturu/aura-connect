import { X, Send } from "lucide-react";

export default function ForwardDialog({ conversations, currentConversationId, onForward, onClose }) {
  const filtered = conversations.filter((c) => c._id !== currentConversationId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Forward message</h3>
          <button onClick={onClose} className="grid size-7 place-items-center rounded-full hover:bg-card/60">
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No other conversations</p>
          ) : (
            filtered.map((c) => {
              const other = c.participants?.find((p) => p._id !== c._id) || c.participants?.[0];
              return (
                <button
                  key={c._id}
                  onClick={() => onForward(c._id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-card/60"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-card text-xs font-semibold uppercase ring-1 ring-border">
                    {other?.profile?.name?.slice(0, 2) ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{other?.profile?.name ?? "Unknown"}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.lastMessage?.body || "No messages"}</p>
                  </div>
                  <Send className="size-4 shrink-0 text-muted-foreground" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}