import { useState, useRef, useEffect } from "react";
import { Send, Image, Paperclip, Smile, X, Reply } from "lucide-react";
import EmojiPicker from "./EmojiPicker";

export default function MessageInput({
  value,
  onChange,
  onSend,
  onUploadImage,
  onUploadFile,
  disabled,
  replyTarget,
  onCancelReply,
  onTypingChange,
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  function handleInputChange(e) {
    const val = e.target.value;
    onChange(val);

    if (!val.trim()) {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTypingChange?.(false);
      }
      return;
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTypingChange?.(true);
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTypingChange?.(false);
    }, 2000);
  }

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTypingChange?.(false);
      }
    };
  }, [onTypingChange]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingChange?.(false);
    }
    onSend();
  }

  function handleEmojiSelect(emoji) {
    onChange(value + emoji);
    setShowEmoji(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  const replyPreview = replyTarget?.decryptedPreview
    ? replyTarget.decryptedPreview
    : replyTarget?.body || "";

  return (
    <form onSubmit={handleSubmit} className="relative border-t border-border">
      {replyTarget && onCancelReply && (
        <div className="flex items-center gap-2 border-b border-border bg-card/50 px-4 py-2">
          <Reply className="size-4 shrink-0 text-brand" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-brand">Replying to {replyTarget.senderName || "user"}</p>
            <p className="truncate text-[11px] text-muted-foreground">{replyPreview}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="grid size-6 shrink-0 place-items-center rounded-full hover:bg-card/60"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {showEmoji && (
        <div className="absolute bottom-full left-4 mb-2">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        </div>
      )}

      <div className="flex items-end gap-1 px-4 py-3 sm:gap-2">
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="grid size-9 sm:size-10 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-card/60 hover:text-foreground transition-colors"
          title="Upload image"
        >
          <Image className="size-4" />
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadImage(file);
            e.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="grid size-9 sm:size-10 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-card/60 hover:text-foreground transition-colors"
          title="Upload file"
        >
          <Paperclip className="size-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadFile(file);
            e.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={() => setShowEmoji((v) => !v)}
          className={`grid size-9 sm:size-10 shrink-0 place-items-center rounded-xl transition-colors ${
            showEmoji
              ? "bg-brand text-brand-foreground"
              : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
          }`}
          title="Emoji picker"
        >
          <Smile className="size-4" />
        </button>

        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={replyTarget ? "Reply..." : "Type a message..."}
          maxLength={4000}
          className="flex-1 rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand"
        />

        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="grid size-9 sm:size-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground disabled:opacity-50 transition-opacity"
        >
          <Send className="size-4" />
        </button>
      </div>
    </form>
  );
}
