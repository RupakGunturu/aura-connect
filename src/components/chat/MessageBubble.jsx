import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck, File, ImageIcon, Reply, Trash2, Pin, PinOff, Forward } from "lucide-react";

function DisappearTimer({ expiresAt, isOwn }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function tick() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("0s");
        return;
      }
      const sec = Math.floor(diff / 1000);
      if (sec >= 3600) setRemaining(`${Math.floor(sec / 3600)}h`);
      else if (sec >= 60) setRemaining(`${Math.floor(sec / 60)}m`);
      else setRemaining(`${sec}s`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!remaining) return null;

  return (
    <div className={`mb-0.5 flex items-center gap-1 text-[10px] ${isOwn ? "text-brand-foreground/60" : "text-muted-foreground"}`}>
      <span className="opacity-70">⌛ {remaining}</span>
    </div>
  );
}

function ReadStatus({ delivered, read }) {
  if (read) return <CheckCheck className="size-3 text-brand" />;
  if (delivered) return <CheckCheck className="size-3 text-muted-foreground" />;
  return <Check className="size-3 text-muted-foreground" />;
}

export default function MessageBubble({ message, isOwn, decryptMessage, onReply, onDelete, onPin, isPinned, onForward }) {
  const [decryptedBody, setDecryptedBody] = useState(null);
  const [decryptedAttachments, setDecryptedAttachments] = useState([]);
  const [replyPreview, setReplyPreview] = useState(null);
  const [replySenderName, setReplySenderName] = useState("");

  useEffect(() => {
    if (!message.encryptedPayload) return;
    decryptMessage(message).then((text) => setDecryptedBody(text));
  }, [message, isOwn, decryptMessage]);

  useEffect(() => {
    if (!message.attachments?.length) return;
    Promise.allSettled(
      message.attachments.map((att) =>
        att.encryptedPayload
          ? decryptMessage({
              ...message,
              encryptedPayload: att.encryptedPayload,
              iv: att.fileIv,
              authTag: att.fileAuthTag,
            }).then((text) => ({ ...att, decryptedText: text }))
          : Promise.resolve(att),
      ),
    ).then((results) => {
      setDecryptedAttachments(results.map((r) => (r.status === "fulfilled" ? r.value : r.reason)));
    });
  }, [message, isOwn, decryptMessage]);

  useEffect(() => {
    if (!message.replyTo || typeof message.replyTo !== "object") return;
    const rep = message.replyTo;
    setReplySenderName(rep.senderId?.profile?.name ?? rep.senderId?._id ?? "Unknown");
    if (rep.encryptedPayload) {
      decryptMessage({
        ...rep,
        senderId: rep.senderId?._id || rep.senderId,
      }).then((text) => setReplyPreview(text));
    } else {
      setReplyPreview(rep.body || "📎 Media");
    }
  }, [message.replyTo, decryptMessage]);

  const isDeleted = message.deletedAt;
  const displayText = isDeleted
    ? ""
    : (message.encryptedPayload ? (decryptedBody ?? "...") : message.body || "");

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isDeleted && isOwn) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] md:max-w-[75%] rounded-2xl border border-border bg-card/30 px-4 py-2 text-sm text-muted-foreground">
          <p className="italic">You deleted this message</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`group flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
          isOwn ? "bg-brand text-brand-foreground" : "bg-card text-foreground ring-1 ring-border"
        }`}
      >
        {message.replyTo && typeof message.replyTo === "object" && (
          <div
            className={`mb-1.5 flex cursor-pointer items-start gap-1.5 border-l-2 pl-2.5 ${
              isOwn ? "border-brand-foreground/50" : "border-brand/50"
            }`}
            onClick={() => {
              document.getElementById(`msg-${message.replyTo._id}`)?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Reply className="mt-0.5 size-3 shrink-0 opacity-60" />
            <div className="min-w-0">
              <p className={`text-[11px] font-semibold ${isOwn ? "text-brand-foreground/70" : "text-brand"}`}>
                {replySenderName}
              </p>
              <p className="truncate text-[11px] opacity-60">{replyPreview ?? "..."}</p>
            </div>
          </div>
        )}

        {message.disappearsAt && (
          <DisappearTimer expiresAt={message.disappearsAt} isOwn={isOwn} />
        )}
        {displayText && <p className="whitespace-pre-wrap break-words">{displayText}</p>}

        {message.attachments?.map((att, i) => (
          <div
            key={i}
            className={`mt-2 flex items-center gap-2 rounded-xl p-2 ${
              isOwn ? "bg-brand-foreground/10" : "bg-background/50"
            }`}
          >
            {att.type === "image" ? (
              <ImageIcon className="size-8 shrink-0 text-muted-foreground" />
            ) : (
              <File className="size-8 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{att.name}</p>
              <p className="text-[10px] text-muted-foreground">{(att.size / 1024).toFixed(1)} KB</p>
            </div>
            <a
              href={att.url}
              download={att.name}
              className="shrink-0 text-[10px] underline underline-offset-2 hover:text-brand"
            >
              Open
            </a>
          </div>
        ))}

        <div
          className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${
            isOwn ? "text-brand-foreground/60" : "text-muted-foreground"
          }`}
        >
          <span>{time}</span>
          {isOwn && <ReadStatus delivered={message.delivered} read={message.read} />}
        </div>

        {message.forwardedFrom && (
          <div className={`mb-0.5 flex items-center gap-1 text-[10px] ${isOwn ? "text-brand-foreground/60" : "text-muted-foreground"}`}>
            <Forward className="size-3" />
            <span>Forwarded</span>
          </div>
        )}
        {isPinned && (
          <div className={`mb-1 flex items-center gap-1 text-[10px] ${isOwn ? "text-brand-foreground/60" : "text-brand"}`}>
            <Pin className="size-3" />
            <span>Pinned</span>
          </div>
        )}

        <div className="absolute -top-3 right-2 hidden gap-1 group-hover:flex">
          {onReply && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReply(message);
              }}
              className="rounded-full border border-border bg-background p-1 shadow-sm"
              title="Reply"
            >
              <Reply className="size-3" />
            </button>
          )}
          {onForward && !isDeleted && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onForward(message);
              }}
              className="rounded-full border border-border bg-background p-1 shadow-sm"
              title="Forward"
            >
              <Forward className="size-3" />
            </button>
          )}
          {onPin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPin(message);
              }}
              className="rounded-full border border-border bg-background p-1 shadow-sm"
              title={isPinned ? "Unpin" : "Pin"}
            >
              {isPinned ? <PinOff className="size-3" /> : <Pin className="size-3" />}
            </button>
          )}
          {onDelete && isOwn && !isDeleted && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(message);
              }}
              className="rounded-full border border-border bg-background p-1 shadow-sm hover:text-destructive"
              title="Delete"
            >
              <Trash2 className="size-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
