import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Phone, Video, MoreVertical, Trash2, Search, X, Timer } from "lucide-react";
import { Avatar } from "./ConversationList";

const DISAPPEAR_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "5s", value: 5 },
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "5m", value: 300 },
  { label: "30m", value: 1800 },
  { label: "1h", value: 3600 },
  { label: "6h", value: 21600 },
  { label: "24h", value: 86400 },
  { label: "7d", value: 604800 },
];

export default function ChatHeader({
  conversation,
  currentUserId,
  isOnline,
  onBack,
  onVoiceCall,
  onVideoCall,
  onClearHistory,
  onSearch,
  disappearDuration,
  onSetDisappear,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDisappear, setShowDisappear] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const other =
    conversation?.participants?.find((p) => p._id !== currentUserId) ??
    conversation?.participants?.[0];

  if (typeof window !== "undefined" && other) {
    console.debug("[ChatHeader] other profile:", other.profile?.name, "avatarUrl:", other.profile?.avatarUrl ? other.profile.avatarUrl.slice(0, 60) + "…" : "none");
  }

  function handleSearchChange(q) {
    setSearchQuery(q);
    onSearch?.(q);
  }

  return (
    <div className="border-b border-border">
      {showSearch ? (
        <div className="flex items-center gap-2 px-4 py-2.5">
          <button
            onClick={() => {
              setShowSearch(false);
              handleSearchChange("");
            }}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search messages..."
            autoFocus
            className="flex-1 rounded-lg border border-border bg-background/50 px-3 py-1.5 text-sm outline-none transition-colors focus:border-brand"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-card/60 hover:text-foreground md:hidden"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="relative shrink-0">
            <Avatar user={other} size="sm" />
            {isOnline && (
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-green-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{other?.profile?.name ?? "Conversation"}</p>
            <p className="text-[10px] text-muted-foreground">{isOnline ? "Online" : "Offline"}</p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onVoiceCall(other?._id, other?.profile?.name)}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-card/60 hover:text-foreground"
              title="Voice call"
            >
              <Phone className="size-4" />
            </button>
            <button
              onClick={() => onVideoCall(other?._id, other?.profile?.name)}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-card/60 hover:text-foreground"
              title="Video call"
            >
              <Video className="size-4" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-card/60 hover:text-foreground"
                title="More"
              >
                <MoreVertical className="size-4" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
                    >
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowSearch(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-card/60"
                    >
                      <Search className="size-4" />
                      <span>Search messages</span>
                    </button>
                    <div className="border-t border-border" />
                    <button
                      onClick={() => {
                        setShowDisappear((v) => !v);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-card/60"
                    >
                      <Timer className="size-4" />
                      <span className="flex-1">Disappearing messages</span>
                      <span className="text-[11px] text-brand">
                        {DISAPPEAR_OPTIONS.find((o) => o.value === disappearDuration)?.label ?? "Off"}
                      </span>
                    </button>
                    {showDisappear && (
                      <div className="border-t border-border px-2 py-1">
                        <div className="grid grid-cols-5 gap-1">
                          {DISAPPEAR_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => {
                                onSetDisappear?.(opt.value);
                                setShowDisappear(false);
                                setShowMenu(false);
                              }}
                              className={`rounded-lg px-1.5 py-1 text-[11px] transition-colors ${
                                opt.value === disappearDuration
                                  ? "bg-brand text-brand-foreground"
                                  : "text-muted-foreground hover:bg-card/60"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="border-t border-border" />
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onClearHistory?.();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-card/60 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                      Delete total history
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
