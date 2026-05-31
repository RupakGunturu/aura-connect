import { ArrowLeft, Phone, Video } from "lucide-react";
import { Avatar } from "./ConversationList";

export default function ChatHeader({
  conversation,
  currentUserId,
  isOnline,
  onBack,
  onVoiceCall,
  onVideoCall,
}) {
  const other =
    conversation?.participants?.find((p) => p._id !== currentUserId) ??
    conversation?.participants?.[0];

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
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
      </div>
    </div>
  );
}
