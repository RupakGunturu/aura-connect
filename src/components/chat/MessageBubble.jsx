import { useState, useEffect, useRef, memo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  CheckCheck,
  File,
  Trash2,
  Forward,
  Clock,
  AlertCircle,
  Download,
  Loader2,
  Copy,
} from "lucide-react";
import ImagePreview from "./ImagePreview";

/* ─────────────────────────────────────────────
   Inline styles — full dark-only design system
   ───────────────────────────────────────────── */
const ds = {
  // Palette
  surface: "#111214",
  surfaceRaised: "#18191d",
  surfaceBorder: "rgba(255,255,255,0.07)",
  surfaceHover: "rgba(255,255,255,0.05)",

  ownBubble: "#1d4ed8",          // rich indigo-blue
  ownBubbleHover: "#1e40af",
  ownBorder: "rgba(96,165,250,0.25)",

  otherBubble: "#1e2027",
  otherBorder: "rgba(255,255,255,0.08)",

  text: "#f0f2f5",
  textMuted: "rgba(240,242,245,0.5)",
  textFaint: "rgba(240,242,245,0.3)",

  brandAccent: "#3b82f6",
  readBlue: "#60a5fa",
  destructive: "#ef4444",
  destructiveDim: "rgba(239,68,68,0.12)",

  replyBarOwn: "rgba(255,255,255,0.25)",
  replyBarOther: "#3b82f6",

  avatarBg: "#2a2d35",
  pinColor: "#facc15",

  radius: {
    bubble: "18px",
    bubbleTailOwn: "18px 4px 18px 18px",
    bubbleTailOther: "4px 18px 18px 18px",
    pill: "999px",
    sm: "10px",
    xs: "7px",
  },

  font: {
    body: "'SF Pro Text', 'Segoe UI', system-ui, sans-serif",
    mono: "'SF Mono', 'Fira Code', monospace",
  },
};

/* ─── Intersection observer hook ─── */
function useIntersection(ref) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setIsVisible(true); obs.disconnect(); } },
      { rootMargin: "300px" }
    );
    obs.observe(el);
    if (el.getBoundingClientRect().top < window.innerHeight + 300) setIsVisible(true);
    return () => obs.disconnect();
  }, [ref]);
  return isVisible;
}

/* ─── Disappear timer ─── */
function DisappearTimer({ expiresAt, isOwn }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    function tick() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setLabel("0s"); return; }
      const s = Math.floor(diff / 1000);
      setLabel(s >= 3600 ? `${Math.floor(s / 3600)}h` : s >= 60 ? `${Math.floor(s / 60)}m` : `${s}s`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!label) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4,
      marginBottom: 4, fontSize: 11,
      color: isOwn ? "rgba(255,255,255,0.55)" : ds.textMuted,
      fontFamily: ds.font.body,
    }}>
      <Clock size={10} strokeWidth={2} />
      <span>{label}</span>
    </div>
  );
}

/* ─── Read receipts ─── */
function ReadStatus({ delivered, read, sending }) {
  if (sending)
    return <Loader2 size={12} strokeWidth={2} className="animate-spin" style={{ flexShrink: 0, color: "rgba(255,255,255,0.35)" }} />;
  if (read)
    return <CheckCheck size={14} strokeWidth={2.2} color={ds.readBlue} style={{ flexShrink: 0 }} />;
  if (delivered)
    return <CheckCheck size={14} strokeWidth={2.2} color="rgba(255,255,255,0.45)" style={{ flexShrink: 0 }} />;
  return <Check size={14} strokeWidth={2.2} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />;
}

function DeleteOptionsSheet({ onDelete, onDeleteForever, onCancel }) {
  const btn = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    width: "100%", padding: "14px 16px",
    border: "0.5px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    fontSize: 15, cursor: "pointer",
    fontFamily: ds.font.body,
    outline: "none",
    WebkitTapHighlightColor: "transparent",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
        }}
        onClick={onCancel}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          style={{
            background: "#1a1c22",
            borderTop: "0.5px solid rgba(255,255,255,0.1)",
            borderRadius: "16px 16px 0 0",
            padding: "20px 16px 56px",
          }}
        >
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: "rgba(255,255,255,0.15)",
            margin: "-8px auto 20px",
          }} />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onDelete}
            style={{ ...btn, background: "rgba(255,255,255,0.05)", marginBottom: 10, textAlign: "center" }}
          >
            Delete for me
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onDeleteForever}
            style={{ ...btn, background: ds.destructiveDim, border: `0.5px solid ${ds.destructive}44`, color: ds.destructive, fontWeight: 600, marginBottom: 10 }}
          >
            <Trash2 size={16} />
            Delete for everyone
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCancel}
            style={{ ...btn, background: "rgba(255,255,255,0.05)" }}
          >
            Cancel
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Context dropdown (desktop right-click) ─── */
function ContextDropdown({ isOwn, onCopy, onDelete, onClose }) {
  const items = [
    { icon: <Copy size={15} />, label: "Copy", handler: onCopy },
    isOwn && { icon: <Trash2 size={15} />, label: "Delete", handler: onDelete, danger: true },
  ].filter(Boolean);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, zIndex: 40 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -6 }}
        transition={{ type: "spring", stiffness: 400, damping: 27 }}
        style={{
          position: "absolute",
          bottom: "calc(100% + 6px)",
          [isOwn ? "right" : "left"]: 0,
          zIndex: 50,
          minWidth: 180,
          background: "#1e2027",
          border: "0.5px solid rgba(255,255,255,0.1)",
          borderRadius: 14,
          padding: "6px",
          boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        {items.map((a) => (
          <button
            key={a.label}
            onClick={(e) => { e.stopPropagation(); a.handler(); onClose(); }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "9px 12px",
              background: "transparent", border: "none", borderRadius: 10,
              color: a.danger ? ds.destructive : ds.text,
              fontSize: 14, cursor: "pointer",
              fontFamily: ds.font.body,
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = a.danger ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            {a.icon}
            <span>{a.label}</span>
          </button>
        ))}
      </motion.div>
    </>
  );
}

/* ─── Mobile action sheet (long-press) ─── */
function MobileActionSheet({ isOwn, onCopy, onDelete, onClose }) {
  const items = [
    { icon: <Copy size={17} />, label: "Copy", handler: onCopy },
    isOwn && { icon: <Trash2 size={17} />, label: "Delete", handler: onDelete, danger: true },
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
      }}
      onClick={onClose}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
          style={{
            background: "#1a1c22",
            borderTop: "0.5px solid rgba(255,255,255,0.1)",
            borderRadius: "16px 16px 0 0",
            padding: "20px 16px 40px",
          }}
      >
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: "rgba(255,255,255,0.15)",
          margin: "-8px auto 20px",
        }} />
        {items.map((a) => (
          <button
            key={a.label}
            onClick={(e) => { e.stopPropagation(); a.handler(); onClose(); }}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              width: "100%", padding: "14px",
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              color: a.danger ? ds.destructive : ds.text,
              fontSize: 15, cursor: "pointer",
              fontFamily: ds.font.body,
              marginBottom: 8,
              transition: "background 0.12s",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {a.icon}
            <span>{a.label}</span>
          </button>
        ))}
        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "14px",
            background: "rgba(255,255,255,0.05)",
            border: "0.5px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            color: ds.text, fontSize: 15,
            cursor: "pointer", fontFamily: ds.font.body,
            marginTop: 4,
          }}
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main MessageBubble ─── */
const MessageBubble = memo(function MessageBubble({
  message, isOwn, sender,
  decryptMessage, decryptAttachment,
  onDelete, onDeleteForever,
}) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [decryptedBody, setDecryptedBody] = useState(null);
  const [replyPreview, setReplyPreview] = useState(null);
  const [replySenderName, setReplySenderName] = useState("");
  const [attachmentUrls, setAttachmentUrls] = useState({});
  const [failedAttachments, setFailedAttachments] = useState(new Set());
  const [avatarError, setAvatarError] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(null);
  const blobRef = useRef({});
  const longPressRef = useRef(null);
  const bubbleRef = useRef(null);
  const isVisible = useIntersection(bubbleRef);
  const isDeleted = !!message.deletedAt;

  /* Long-press / context menu */
  const touchStartRef = useRef(null);
  function openContextMenu(e) {
    e?.preventDefault?.();
    if (isDeleted) return;
    setShowContextMenu(true);
  }
  function startLongPress(e) {
    if (isDeleted) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    longPressRef.current = setTimeout(() => setShowActionSheet(true), 480);
  }
  function cancelLongPress(e) {
    if (longPressRef.current) {
      if (e && touchStartRef.current) {
        const dx = Math.abs(e.changedTouches[0].clientX - touchStartRef.current.x);
        const dy = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);
        if (dx < 15 && dy < 15) return;
      }
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }
  useEffect(() => () => cancelLongPress(), []);

  function handleCopy() {
    const txt = message.encryptedPayload ? (decryptedBody ?? "") : message.body || "";
    if (txt && navigator.clipboard?.writeText) navigator.clipboard.writeText(txt);
  }

  /* Decrypt body */
  useEffect(() => {
    if (!message.encryptedPayload || !isVisible) return;
    decryptMessage(message).then(setDecryptedBody);
  }, [message, decryptMessage, isVisible]);

  /* Decrypt attachments */
  useEffect(() => {
    if (!message.attachments?.length || !decryptAttachment || !isVisible) return;
    let alive = true;
    const failed = new Set();
    Promise.all(
      message.attachments.map(async (att, i) => {
        if (!att.fileIv) return [i, null];
        const url = await decryptAttachment(message, att);
        if (!url) failed.add(i);
        return [i, url];
      })
    ).then((res) => {
      if (!alive) return;
      const urls = Object.fromEntries(res.filter(([, u]) => u));
      Object.entries(blobRef.current).forEach(([k, u]) => { if (!urls[k] && u?.startsWith("blob:")) URL.revokeObjectURL(u); });
      blobRef.current = urls;
      setAttachmentUrls(urls);
      setFailedAttachments(failed);
    }).catch(() => {});
    return () => {
      alive = false;
      Object.values(blobRef.current).forEach((u) => { if (u?.startsWith("blob:")) URL.revokeObjectURL(u); });
      blobRef.current = {};
    };
  }, [message, decryptAttachment, isVisible]);

  /* Decrypt reply preview */
  useEffect(() => {
    const rep = message.replyTo;
    if (!rep || typeof rep !== "object" || !isVisible) return;
    setReplySenderName(rep.senderId?.profile?.name ?? rep.senderId?._id ?? "Unknown");
    if (rep.encryptedPayload) {
      decryptMessage({ ...rep, senderId: rep.senderId?._id || rep.senderId })
        .then((t) => setReplyPreview(t && !t.startsWith("⚠️") ? t : "🔒 Encrypted message"));
    } else {
      setReplyPreview(rep.body || "📎 Media");
    }
  }, [message.replyTo, decryptMessage, isVisible]);

  const isTemp = typeof message._id === "string" && message._id.startsWith("temp-");
  const rawText = isDeleted ? "" : (message.encryptedPayload ? (decryptedBody ?? "…") : message.body || "");
  const displayText = rawText.startsWith("⚠️") ? null : rawText;
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  /* ── Deleted state ── */
  if (isDeleted) {
    return (
      <div style={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start", padding: "1px 0" }}>
        <div style={{
          fontSize: 13, fontStyle: "italic",
          color: ds.textFaint,
          fontFamily: ds.font.body,
          padding: "6px 14px",
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.07)",
          borderRadius: ds.radius.bubble,
        }}>
          {isOwn ? "You deleted this message" : "This message was deleted"}
        </div>
      </div>
    );
  }

  const bubbleRadius = isOwn ? ds.radius.bubbleTailOwn : ds.radius.bubbleTailOther;
  const avatarInitials = sender?.profile?.handle?.slice(0, 2)?.toUpperCase() ?? "?";

  return (
    <motion.div
      ref={bubbleRef}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
        justifyContent: isOwn ? "flex-end" : "flex-start",
        padding: "1px 0",
        fontFamily: ds.font.body,
      }}
      onContextMenu={openContextMenu}
      onTouchStart={startLongPress}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
    >
      {/* ── Avatar (others) ── */}
      {!isOwn && (
        <div style={{
          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
          overflow: "hidden", marginBottom: 2,
          background: ds.avatarBg,
          border: "0.5px solid rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {sender?.profile?.avatarUrl && !avatarError ? (
            <img
              src={sender.profile.avatarUrl}
              alt=""
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={() => setAvatarError(true)}
            />
          ) : (
            <span style={{ fontSize: 11, fontWeight: 600, color: ds.textMuted, letterSpacing: "0.04em" }}>
              {avatarInitials}
            </span>
          )}
        </div>
      )}

      {/* ── Bubble wrapper (relative for action bar) ── */}
      <div style={{ position: "relative", maxWidth: "min(78%, 380px)" }}>
        <AnimatePresence>
          {showContextMenu && (
            <ContextDropdown
              isOwn={isOwn}
              onCopy={() => { handleCopy(); setShowContextMenu(false); }}
              onDelete={() => { setShowContextMenu(false); setShowDeleteOptions(true); }}
              onClose={() => setShowContextMenu(false)}
            />
          )}
        </AnimatePresence>

        {/* ── Bubble ── */}
        <div
          style={{
            background: isOwn ? ds.ownBubble : ds.otherBubble,
            border: `0.5px solid ${isOwn ? ds.ownBorder : ds.otherBorder}`,
            borderRadius: bubbleRadius,
            padding: "9px 13px 7px",
            cursor: "default",
            userSelect: "text",
            WebkitUserSelect: "text",
          }}
        >
          {/* ── Forwarded indicator ── */}
          {message.forwardedFrom && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }}>
              <Forward size={10} color={isOwn ? "rgba(255,255,255,0.5)" : ds.textMuted} strokeWidth={2.5} />
              <span style={{ fontSize: 10, color: isOwn ? "rgba(255,255,255,0.5)" : ds.textMuted, fontWeight: 500, letterSpacing: "0.03em" }}>
                Forwarded
              </span>
            </div>
          )}

          {/* ── Reply preview ── */}
          {message.replyTo && typeof message.replyTo === "object" && (
            <div
              onClick={() => document.getElementById(`msg-${message.replyTo._id}`)?.scrollIntoView({ behavior: "smooth" })}
              style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                marginBottom: 7,
                paddingLeft: 10,
                borderLeft: `2px solid ${isOwn ? "rgba(255,255,255,0.3)" : ds.replyBarOther}`,
                cursor: "pointer",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontSize: 11, fontWeight: 600, margin: 0, marginBottom: 1,
                  color: isOwn ? "rgba(255,255,255,0.75)" : ds.brandAccent,
                  letterSpacing: "0.01em",
                }}>
                  {replySenderName}
                </p>
                <p style={{
                  fontSize: 11, margin: 0, color: isOwn ? "rgba(255,255,255,0.4)" : ds.textFaint,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  maxWidth: 200,
                }}>
                  {replyPreview ?? "…"}
                </p>
              </div>
            </div>
          )}

          {/* ── Timer ── */}
          {message.disappearsAt && (
            <DisappearTimer expiresAt={message.disappearsAt} isOwn={isOwn} />
          )}

          {/* ── Text body ── */}
          {displayText && (
            <p style={{
              margin: 0, fontSize: 15, lineHeight: 1.45,
              color: isOwn ? "#ffffff" : ds.text,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
              letterSpacing: "0.01em",
            }}>
              {displayText}
            </p>
          )}

          {/* ── Attachments ── */}
          {message.attachments?.map((att, i) => {
            const isEnc = !!att.fileIv;
            const url = attachmentUrls[i];
            const failed = isEnc && failedAttachments.has(i);
            const pending = isEnc && !url && !failed;

            if (failed) return (
              <AttachmentShell key={i} isOwn={isOwn}>
                <AlertCircle size={18} color={ds.destructive} strokeWidth={1.8} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: ds.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name}</p>
                  <p style={{ fontSize: 11, margin: 0, color: ds.destructive }}>Decryption failed</p>
                </div>
              </AttachmentShell>
            );

            if (pending) return (
              <AttachmentShell key={i} isOwn={isOwn}>
                <File size={18} strokeWidth={1.5} style={{ color: ds.textMuted, flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: ds.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name}</p>
                  <p style={{ fontSize: 11, margin: 0, color: ds.textFaint }}>Decrypting…</p>
                </div>
                <DecryptSpinner />
              </AttachmentShell>
            );

            if (att.type === "image") return (
              <div key={i} onClick={() => {
                const imgIdx = message.attachments.findIndex((a, idx) => a.type === "image" && idx === i);
                setPreviewIndex(imgIdx >= 0 ? imgIdx : 0);
              }}
                style={{ display: "block", marginTop: displayText ? 8 : 0, borderRadius: 12, overflow: "hidden", cursor: "pointer" }}>
                <img src={url} alt={att.name} loading="lazy"
                  style={{ width: "100%", maxHeight: 280, objectFit: "cover", display: "block" }} />
              </div>
            );

            return (
              <AttachmentShell key={i} isOwn={isOwn}>
                <File size={18} strokeWidth={1.5} style={{ color: isOwn ? "rgba(255,255,255,0.6)" : ds.textMuted, flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: isOwn ? "rgba(255,255,255,0.9)" : ds.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name}</p>
                  <p style={{ fontSize: 11, margin: 0, color: isOwn ? "rgba(255,255,255,0.45)" : ds.textFaint }}>{(att.size / 1024).toFixed(1)} KB</p>
                </div>
                <a href={url} download={att.name}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 28, height: 28, borderRadius: "50%",
                    background: isOwn ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
                    border: "0.5px solid rgba(255,255,255,0.15)",
                    color: isOwn ? "#fff" : ds.text,
                    flexShrink: 0, textDecoration: "none",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={13} strokeWidth={2} />
                </a>
              </AttachmentShell>
            );
          })}

          {/* ── Meta row: time + read status ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            gap: 4, marginTop: 4,
            color: isOwn ? "rgba(255,255,255,0.45)" : ds.textFaint,
            fontSize: 11, letterSpacing: "0.01em",
          }}>
            <span>{time}</span>
            {isOwn && <ReadStatus delivered={message.delivered} read={message.read} sending={isTemp} />}
          </div>
        </div>
      </div>

      {/* ── Image preview ── */}
      {previewIndex !== null && (() => {
        const full = message.attachments ?? [];
        const imgAtts = full.filter((a) => a.type === "image");
        const imgs = imgAtts.map((a) => {
          const origIdx = full.indexOf(a);
          return { url: attachmentUrls[origIdx] || a.url, name: a.name };
        });
        return (
          <ImagePreview
            images={imgs}
            initialIndex={Math.min(previewIndex, imgs.length - 1)}
            onClose={() => setPreviewIndex(null)}
          />
        );
      })()}

      {/* ── Action sheet (mobile long-press) ── */}
      {showActionSheet && createPortal(
        <MobileActionSheet
          isOwn={isOwn}
          onCopy={() => { handleCopy(); setShowActionSheet(false); }}
          onDelete={() => { setShowActionSheet(false); setShowDeleteOptions(true); }}
          onClose={() => setShowActionSheet(false)}
        />,
        document.body
      )}

      {/* ── Delete options sheet (portal to body) ── */}
      {showDeleteOptions && createPortal(
        <DeleteOptionsSheet
          onDelete={() => { onDelete?.(message); setShowDeleteOptions(false); }}
          onDeleteForever={() => { onDeleteForever?.(message); setShowDeleteOptions(false); }}
          onCancel={() => setShowDeleteOptions(false)}
        />,
        document.body
      )}
    </motion.div>
  );
});

/* ── Attachment row shell ── */
function AttachmentShell({ isOwn, children }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      marginTop: 6,
      background: isOwn ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.05)",
      border: "0.5px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      padding: "9px 10px",
    }}>
      {children}
    </div>
  );
}

/* ── Small CSS spinner for decrypt pending ── */
export default MessageBubble;

function DecryptSpinner() {
  return (
    <div style={{
      width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
      border: "2px solid rgba(255,255,255,0.15)",
      borderTop: "2px solid rgba(255,255,255,0.5)",
      animation: "spin 0.8s linear infinite",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}