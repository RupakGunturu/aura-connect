import { useState, useEffect } from "react";
import { Check, CheckCheck, File, ImageIcon } from "lucide-react";

function ReadStatus({ delivered, read }) {
  if (read) return <CheckCheck className="size-3 text-brand" />;
  if (delivered) return <CheckCheck className="size-3 text-muted-foreground" />;
  return <Check className="size-3 text-muted-foreground" />;
}

export default function MessageBubble({ message, isOwn, decryptMessage }) {
  const [decryptedBody, setDecryptedBody] = useState(null);
  const [decryptedAttachments, setDecryptedAttachments] = useState([]);
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

  const displayText = message.encryptedPayload
    ? (decryptedBody ?? "...")
    : message.body || "";

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
          isOwn ? "bg-brand text-brand-foreground" : "bg-card text-foreground ring-1 ring-border"
        }`}
      >
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
      </div>
    </div>
  );
}
