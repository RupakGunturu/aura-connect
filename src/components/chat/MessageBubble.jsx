import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck, File, Reply, Trash2, Forward, Pin } from "lucide-react";

function useIntersection(ref) {
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.disconnect(); } },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    setIsVisible(el.getBoundingClientRect().top < window.innerHeight + 200);
    return () => obs.disconnect();
  }, [ref]);
  return isVisible;
}

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
    <div className={`mb-0.5 flex items-center gap-1 text-[10px] ${isOwn ? "text-foreground/60" : "text-muted-foreground"}`}>
      <span className="opacity-70">⌛ {remaining}</span>
    </div>
  );
}

function ReadStatus({ delivered, read }) {
  if (read) return <CheckCheck className="size-4 shrink-0 text-blue-400" />;
  if (delivered) return <CheckCheck className="size-4 shrink-0 text-foreground/60" />;
  return <Check className="size-4 shrink-0 text-muted-foreground/70" />;
}

export default function MessageBubble({ message, isOwn, sender, decryptMessage, decryptAttachment, onReply, onDelete, onPin, isPinned, onForward }) {
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [decryptedBody, setDecryptedBody] = useState(null);
  const [replyPreview, setReplyPreview] = useState(null);
  const [replySenderName, setReplySenderName] = useState("");
  const [attachmentObjectUrls, setAttachmentObjectUrls] = useState({});
  const [failedAttachments, setFailedAttachments] = useState(new Set());
  const [senderImgError, setSenderImgError] = useState(false);
  const blobUrlsRef = useRef({});
  const longPressRef = useRef(null);
  const bubbleRef = useRef(null);
  const isVisible = useIntersection(bubbleRef);

  function handleContextMenu(e) {
    if (!onDelete || !isOwn || isDeleted) return;
    e.preventDefault();
    setShowDeletePrompt(true);
  }

  function handleTouchStart() {
    if (!onDelete || !isOwn || isDeleted) return;
    longPressRef.current = setTimeout(() => {
      setShowDeletePrompt(true);
    }, 600);
  }

  function handleTouchEnd() {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      if (longPressRef.current) clearTimeout(longPressRef.current);
    };
  }, []);

  useEffect(() => {
    if (!message.encryptedPayload || !isVisible) return;
    decryptMessage(message).then((text) => setDecryptedBody(text));
  }, [message, isOwn, decryptMessage, isVisible]);

  useEffect(() => {
    if (!message.attachments?.length || !decryptAttachment || !isVisible) return;
    let active = true;

    const failed = new Set();
    Promise.all(
      message.attachments.map(async (att, i) => {
        if (!att.fileIv) return [i, null];
        const url = await decryptAttachment(message, att);
        if (!url) failed.add(i);
        return [i, url];
      }),
    ).then((results) => {
      if (!active) return;
      const newUrls = Object.fromEntries(results.filter(([, url]) => url));
      Object.entries(blobUrlsRef.current).forEach(([key, url]) => {
        if (!newUrls[key] && url?.startsWith("blob:")) URL.revokeObjectURL(url);
      });
      blobUrlsRef.current = newUrls;
      setAttachmentObjectUrls(newUrls);
      setFailedAttachments(failed);
    }).catch(() => {});

    return () => {
      active = false;
      Object.values(blobUrlsRef.current).forEach((url) => {
        if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
      });
      blobUrlsRef.current = {};
    };
  }, [message, decryptAttachment, isVisible]);

  useEffect(() => {
    if (!message.replyTo || typeof message.replyTo !== "object" || !isVisible) return;
    const rep = message.replyTo;
    setReplySenderName(rep.senderId?.profile?.name ?? rep.senderId?._id ?? "Unknown");
    if (rep.encryptedPayload) {
      decryptMessage({
        ...rep,
        senderId: rep.senderId?._id || rep.senderId,
      }).then((text) => setReplyPreview(text && !text.startsWith("⚠️") ? text : "📎 Encrypted message"));
    } else {
      setReplyPreview(rep.body || "📎 Media");
    }
  }, [message.replyTo, decryptMessage, isVisible]);

  const isDeleted = message.deletedAt;
  const displayText = isDeleted
    ? ""
    : (message.encryptedPayload ? (decryptedBody ?? "...") : message.body || "");
  const showText = displayText && !displayText.startsWith("⚠️");

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
      ref={bubbleRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`group flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
    >
      {!isOwn && (
        <div className="mb-0.5 size-7 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
          {sender?.profile?.avatarUrl && !senderImgError ? (
            <img src={sender.profile.avatarUrl} alt="" className="size-full object-cover" onError={() => setSenderImgError(true)} />
          ) : (
            <div className="grid size-full place-items-center bg-card text-[10px] font-semibold uppercase">
              {sender?.profile?.handle?.slice(0, 2) ?? "?"}
            </div>
          )}
        </div>
      )}
      <div
        className={`relative max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
          isOwn ? "bubble-me text-foreground" : "bg-card text-foreground ring-1 ring-border"
        }`}
      >
        {message.replyTo && typeof message.replyTo === "object" && (
          <div
            className={`mb-1.5 flex cursor-pointer items-start gap-1.5 border-l-2 pl-2.5 ${
              isOwn ? "border-foreground/30" : "border-brand/50"
            }`}
            onClick={() => {
              document.getElementById(`msg-${message.replyTo._id}`)?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Reply className="mt-0.5 size-3 shrink-0 opacity-60" />
            <div className="min-w-0">
                <p className={`text-[11px] font-semibold ${isOwn ? "text-foreground/70" : "text-brand"}`}>
                {replySenderName}
              </p>
              <p className="truncate text-[11px] opacity-60">{replyPreview ?? "..."}</p>
            </div>
          </div>
        )}

        {message.disappearsAt && (
          <DisappearTimer expiresAt={message.disappearsAt} isOwn={isOwn} />
        )}
        {showText && <p className="whitespace-pre-wrap break-words">{displayText}</p>}

        {message.attachments?.map((att, i) => {
          const isEncrypted = !!att.fileIv;
          const urlOk = attachmentObjectUrls[i];
          const decryptFailed = isEncrypted && failedAttachments.has(i);
          const decryptPending = isEncrypted && !urlOk && !decryptFailed;

          if (decryptFailed) {
            return (
              <div
                key={i}
                className={`mt-2 flex items-center gap-2 rounded-xl p-2 ${
                  isOwn ? "bg-foreground/10" : "bg-background/50"
                }`}
              >
                <File className="size-8 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{att.name}</p>
                  <p className="text-[10px] text-muted-foreground">Decryption failed</p>
                </div>
              </div>
            );
          }

          if (decryptPending) {
            return (
              <div
                key={i}
                className={`mt-2 flex items-center gap-2 rounded-xl p-2 ${
                  isOwn ? "bg-foreground/10" : "bg-background/50"
                }`}
              >
                <File className="size-8 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{att.name}</p>
                  <p className="text-[10px] text-muted-foreground">Decrypting…</p>
                </div>
              </div>
            );
          }

          return att.type === "image" ? (
            <a
              key={i}
              href={urlOk}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block"
            >
              <img
                src={urlOk}
                alt={att.name}
                className="max-h-72 w-full rounded-xl object-cover"
              />
            </a>
          ) : (
            <div
              key={i}
              className={`mt-2 flex items-center gap-2 rounded-xl p-2 ${
                isOwn ? "bg-foreground/10" : "bg-background/50"
              }`}
            >
              <File className="size-8 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{att.name}</p>
                <p className="text-[10px] text-muted-foreground">{(att.size / 1024).toFixed(1)} KB</p>
              </div>
              <a
                href={urlOk}
                download={att.name}
                className="shrink-0 text-[10px] underline underline-offset-2 hover:text-brand"
              >
                Open
              </a>
            </div>
          );
        })}

        <div
          className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${
            isOwn ? "text-foreground/60" : "text-muted-foreground"
          }`}
        >
          <span>{time}</span>
          {isOwn && <ReadStatus delivered={message.delivered} read={message.read} />}
        </div>

        {message.forwardedFrom && (
          <div className={`mb-0.5 flex items-center gap-1 text-[10px] ${isOwn ? "text-foreground/60" : "text-muted-foreground"}`}>
            <Forward className="size-3" />
            <span>Forwarded</span>
          </div>
        )}
        {isPinned && (
          <div className={`mb-1 flex items-center gap-1 text-[10px] ${isOwn ? "text-foreground/60" : "text-brand"}`}>
            <Pin className="size-3" />
            <span>Pinned</span>
          </div>
        )}

        {showDeletePrompt && onDelete && isOwn && !isDeleted && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDeletePrompt(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.12 }}
              className="absolute -top-3 right-2 z-50"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(message);
                  setShowDeletePrompt(false);
                }}
                className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium shadow-lg hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="size-3.5" />
                <span>Delete</span>
              </button>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}
