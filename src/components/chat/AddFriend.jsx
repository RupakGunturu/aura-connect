import { Search, ArrowLeft, UserPlus, Users } from "lucide-react";

export default function AddFriend({
  show,
  onToggle,
  searchQuery,
  onSearch,
  searchResults,
  onStartConversation,
  onSendFriendRequest,
  onShowFriends,
  friendRequestCount,
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Messages</h2>
        <div className="flex gap-1">
          <button
            onClick={onShowFriends}
            className="relative grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-card/60 hover:text-foreground"
            title="Friends"
          >
            <Users className="size-4" />
            {friendRequestCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                {friendRequestCount}
              </span>
            )}
          </button>
          <button
            onClick={onToggle}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-card/60 hover:text-foreground"
          >
            {show ? <ArrowLeft className="size-4" /> : <UserPlus className="size-4" />}
          </button>
        </div>
      </div>

      {show && (
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search by handle or email..."
              className="w-full rounded-xl border border-border bg-background/50 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-brand"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1">
              {searchResults.map((u) => (
                <button
                  key={u._id}
                  onClick={() => onStartConversation(u._id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-card/60"
                >
                  <div className="grid size-8 shrink-0 place-items-center rounded-full bg-card text-xs font-semibold uppercase ring-1 ring-border">
                    {u.profile.handle.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{u.profile.name}</p>
                    <p className="truncate text-xs text-muted-foreground">@{u.profile.handle}</p>
                  </div>
                  {onSendFriendRequest && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendFriendRequest(u._id);
                      }}
                      className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:text-brand"
                      title="Add friend"
                    >
                      <UserPlus className="size-4" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
