import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  MessageCircle,
  Search,
  Send,
  Smile,
  ImageIcon,
  Reply,
  X,
  UserPlus,
  Users,
} from "lucide-react";
import { api, API_URL } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCall } from "@/contexts/CallContext";
import { connectSocket } from "@/lib/socket";
import {
  generateKeyPair,
  deriveSharedSecret,
  encryptMessage,
  decryptMessage,
  encryptFile,
  decryptFile,
  base64Url,
} from "@/lib/e2ee";
import {
  storeKey,
  getKey,
  removeKey,
  setCurrentUser,
  clearAllKeys,
} from "@/lib/keyStore";
import ConversationList from "@/components/chat/ConversationList";
import AddFriend from "@/components/chat/AddFriend";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import ForwardDialog from "@/components/chat/ForwardDialog";
import FriendRequests from "@/components/chat/FriendRequests";
import EmojiPicker from "@/components/chat/EmojiPicker";
import TypingIndicator from "@/components/chat/TypingIndicator";
import {
  requestNotificationPermission,
} from "@/lib/notifications";

/* ─── key helpers ────────────────────────────────────────────────────────── */
function uid(key) {
  return (u) => `${u}:${key}`;
}
const USER_ID_KEY = "userId";
const PRIVATE_KEY_FN = uid("privateKey");
const PUBLIC_KEY_FN = uid("publicKey");

/* ─── styles ─────────────────────────────────────────────────────────────── */
const S = {
  root: {
    display: "flex",
    height: "100%",
    width: "100%",
    overflow: "hidden",
    background: "#0a0a0a",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },

  /* sidebar */
  sidebar: {
    display: "flex",
    flexDirection: "column",
    width: "320px",
    minWidth: "320px",
    height: "100%",
    background: "#111111",
    borderRight: "1px solid #1f1f1f",
    overflow: "hidden",
  },
  sidebarHidden: { display: "none" },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 16px 12px",
    borderBottom: "1px solid #1f1f1f",
    flexShrink: 0,
  },
  sidebarTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#f5f5f5",
    letterSpacing: "-0.3px",
    margin: 0,
  },
  iconBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#888",
    transition: "background 0.15s, color 0.15s",
  },
  searchWrap: {
    padding: "8px 12px",
    borderBottom: "1px solid #1f1f1f",
    flexShrink: 0,
  },
  searchInput: {
    width: "100%",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    color: "#e0e0e0",
    fontSize: "13px",
    padding: "7px 10px 7px 34px",
    outline: "none",
    boxSizing: "border-box",
  },
  searchIconWrap: {
    position: "absolute",
    left: "22px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    color: "#555",
  },
  convListWrap: { flex: 1, overflowY: "auto", padding: "4px 0" },

  /* conversation item */
  convItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    transition: "background 0.12s",
    borderRadius: "0",
    position: "relative",
  },
  convItemActive: { background: "#1c1c1c" },
  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#1e3a5f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: 600,
    color: "#5ba4f5",
    flexShrink: 0,
    position: "relative",
  },
  onlineDot: {
    position: "absolute",
    bottom: "1px",
    right: "1px",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#22c55e",
    border: "2px solid #111111",
  },
  convName: {
    fontSize: "13.5px",
    fontWeight: 500,
    color: "#e8e8e8",
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  convLast: {
    fontSize: "12px",
    color: "#666",
    margin: "2px 0 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  unreadBadge: {
    background: "#2563eb",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 600,
    borderRadius: "10px",
    padding: "1px 6px",
    minWidth: "18px",
    textAlign: "center",
    flexShrink: 0,
  },

  /* main chat area */
  chatArea: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    height: "100%",
    overflow: "hidden",
    background: "#0d0d0d",
    minWidth: 0,
  },
  chatAreaHidden: { display: "none" },

  /* chat header */
  chatHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    background: "#111111",
    borderBottom: "1px solid #1f1f1f",
    flexShrink: 0,
  },
  peerName: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#f0f0f0",
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  peerStatus: {
    fontSize: "11.5px",
    color: "#22c55e",
    margin: "1px 0 0",
  },
  peerStatusOff: {
    fontSize: "11.5px",
    color: "#555",
    margin: "1px 0 0",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginLeft: "auto",
  },

  /* input area */
  inputArea: {
    background: "#111111",
    borderTop: "1px solid #1f1f1f",
    padding: "10px 12px 12px",
    flexShrink: 0,
  },
  replyPreview: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#161b27",
    border: "1px solid #1e2d48",
    borderRadius: "8px",
    padding: "6px 10px",
    marginBottom: "8px",
    fontSize: "12px",
    color: "#8ab4f8",
  },
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "12px",
    padding: "6px 8px",
  },
  textarea: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#e0e0e0",
    fontSize: "13.5px",
    lineHeight: "1.5",
    resize: "none",
    maxHeight: "120px",
    minHeight: "22px",
    padding: "2px 4px",
    fontFamily: "inherit",
  },
  sendBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    background: "#2563eb",
    border: "none",
    cursor: "pointer",
    color: "#fff",
    flexShrink: 0,
    transition: "background 0.15s, opacity 0.15s",
  },
  sendBtnDisabled: {
    background: "#1f1f1f",
    color: "#444",
    cursor: "not-allowed",
  },

  /* empty state */
  empty: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    color: "#444",
  },
  emptyIcon: { opacity: 0.25 },
  emptyText: { fontSize: "14px", color: "#555", margin: 0 },

  /* typing */
  typingWrap: {
    padding: "4px 16px 8px",
    fontSize: "12px",
    color: "#555",
    fontStyle: "italic",
    flexShrink: 0,
  },

  /* back button */
  backBtn: {
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#888",
    flexShrink: 0,
  },
};

/* ─── helpers ────────────────────────────────────────────────────────────── */
function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/* ─── component ──────────────────────────────────────────────────────────── */
export default function Chat() {
  const { user, token, friendRequestCount, clearUnreadBadge } = useAuth();
  const { startCall } = useCall();
  const navigate = useNavigate();
  const { conversationId } = useParams();

  useEffect(() => {
    clearUnreadBadge?.();
  }, [conversationId, clearUnreadBadge]);

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const [forwardTarget, setForwardTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showFriends, setShowFriends] = useState(false);
  const [matchingMessageIds, setMatchingMessageIds] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});
  const [e2eeReady, setE2eeReady] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isSending, setIsSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);          // ← debounce flag
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  function handleEmojiSelect(emoji) {
    setBody((prev) => prev + emoji);
    setShowEmojiPicker(false);
  }

  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;
  const textareaRef = useRef(null);

  const sharedSecretsRef = useRef({});
  const pendingSecretsRef = useRef({});
  const peerPublicKeysRef = useRef({});
  const socketRef = useRef(null);
  const messageCounterRef = useRef(0);
  const decryptedTextCache = useRef({});
  const sendingRef = useRef(false);

  const activeConversation = conversations.find((c) => c._id === conversationId);

  function otherParticipant(conversation) {
    return (
      conversation?.participants?.find((p) => p._id !== user?.id) ??
      conversation?.participants?.[0]
    );
  }

  /* ─── e2ee ──────────────────────────────────────────────────────────────── */
  async function initE2EE() {
    try {
      setCurrentUser(user.id);
      setE2eeReady(true);
      const storedUserId = await getKey(USER_ID_KEY, user.id);
      if (storedUserId !== user.id) {
        sharedSecretsRef.current = {};
        await clearAllKeys();
        const kp = generateKeyPair();
        await Promise.all([
          storeKey(USER_ID_KEY, user.id, user.id),
          storeKey(PRIVATE_KEY_FN(user.id), kp.privateKey, user.id),
          storeKey(PUBLIC_KEY_FN(user.id), kp.publicKey, user.id),
          api("/users/me/public-key", {
            method: "PUT",
            body: JSON.stringify({ publicKey: kp.publicKey }),
            token,
          }),
        ]);
      } else {
        const pubKey = await getKey(PUBLIC_KEY_FN(user.id), user.id);
        if (pubKey) {
          try {
            await api("/users/me/public-key", {
              method: "PUT",
              body: JSON.stringify({ publicKey: pubKey }),
              token,
            });
          } catch {}
        }
      }
    } catch (err) {
      console.error("E2EE init failed", err);
    }
  }

  async function getSharedSecret(peerId) {
    if (pendingSecretsRef.current[peerId]) return pendingSecretsRef.current[peerId];
    const promise = (async () => {
      try {
        let peerPubKey = peerPublicKeysRef.current[peerId];
        const indexKey = [user.id, peerId].sort().join(":");
        if (peerPubKey) {
          const ck = [user.id, peerId, peerPubKey].join(":");
          if (sharedSecretsRef.current[ck]) return sharedSecretsRef.current[ck];
          const [cs, cp] = await Promise.all([
            getKey(`sharedSecret:${indexKey}`, user.id),
            getKey(`sharedSecretPubKey:${indexKey}`, user.id),
          ]);
          if (cs && cp === peerPubKey) { sharedSecretsRef.current[ck] = cs; return cs; }
        } else {
          const [cs, cp] = await Promise.all([
            getKey(`sharedSecret:${indexKey}`, user.id),
            getKey(`sharedSecretPubKey:${indexKey}`, user.id),
          ]);
          if (cs && cp) {
            peerPublicKeysRef.current[peerId] = cp;
            const ck = [user.id, peerId, cp].join(":");
            sharedSecretsRef.current[ck] = cs;
            return cs;
          }
        }
        if (!peerPubKey) {
          const res = await api(`/users/${peerId}/public-key`, { token });
          peerPubKey = res.publicKey;
          if (!peerPubKey) { toast.error("User has no public key"); return null; }
          peerPublicKeysRef.current[peerId] = peerPubKey;
        }
        const ck = [user.id, peerId, peerPubKey].join(":");
        if (sharedSecretsRef.current[ck]) return sharedSecretsRef.current[ck];
        const [cs, cp] = await Promise.all([
          getKey(`sharedSecret:${indexKey}`, user.id),
          getKey(`sharedSecretPubKey:${indexKey}`, user.id),
        ]);
        if (cs && cp === peerPubKey) { sharedSecretsRef.current[ck] = cs; return cs; }
        const privKey = await getKey(PRIVATE_KEY_FN(user.id), user.id);
        if (!privKey) { toast.error("Encryption key missing. Re-login."); return null; }
        const secret = deriveSharedSecret(privKey, peerPubKey);
        sharedSecretsRef.current[ck] = secret;
        await Promise.all([
          storeKey(`sharedSecret:${indexKey}`, secret, user.id),
          storeKey(`sharedSecretPubKey:${indexKey}`, peerPubKey, user.id),
        ]);
        return secret;
      } catch (err) {
        console.error("getSharedSecret:", err);
        return null;
      }
    })();
    pendingSecretsRef.current[peerId] = promise;
    try { return await promise; } finally { delete pendingSecretsRef.current[peerId]; }
  }

  /* ─── effects ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (user?.id) initE2EE();
    requestNotificationPermission();
  }, [user?.id]);

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
      markConversationRead(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    setPinnedMessages(activeConversation?.pinned ?? []);
  }, [activeConversation?.pinned]);

  /* ─── socket ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const s = connectSocket(token);
    socketRef.current = s;

    s.on("userOnline", ({ userId }) => setOnlineUsers((p) => new Set(p).add(userId)));
    s.on("userOffline", ({ userId }) =>
      setOnlineUsers((p) => { const n = new Set(p); n.delete(userId); return n; })
    );
    s.on("friendRequestAccepted", () => toast.success("Friend request accepted!"));
    s.on("messagePinned", () => loadConversations());
    s.on("messageUnpinned", () => loadConversations());
    s.on("messageDeleted", ({ messageId }) =>
      setMessages((p) => p.map((m) => m._id === messageId ? { ...m, deletedAt: new Date().toISOString() } : m))
    );
    s.on("conversationRead", ({ conversationId: cid }) =>
      setMessages((p) => p.map((m) => m.conversationId === cid && m.senderId !== user?.id ? { ...m, read: true } : m))
    );
    s.on("typing:start", ({ userId: uid }) => {
      if (uid === user?.id) return;
      setTypingUsers((p) => { const n = new Set(p); n.add(uid); return n; });
    });
    s.on("typing:stop", ({ userId: uid }) =>
      setTypingUsers((p) => { const n = new Set(p); n.delete(uid); return n; })
    );
    s.on("message", (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        if (msg.conversationId === conversationIdRef.current) {
          markMessageDelivered(msg._id);
          return [...prev, msg];
        }
        return prev;
      });
      setConversations((p) => p.map((c) => c._id === msg.conversationId ? { ...c, lastMessage: msg } : c));
      if (msg.conversationId !== conversationIdRef.current)
        setUnreadCounts((p) => ({ ...p, [msg.conversationId]: (p[msg.conversationId] || 0) + 1 }));
    });
    s.emit("online");

    return () => {
      s.off("userOnline"); s.off("userOffline"); s.off("conversationRead");
      s.off("message"); s.off("typing:start"); s.off("typing:stop");
      s.off("messagePinned"); s.off("messageUnpinned");
      s.off("messageDeleted"); s.off("friendRequestAccepted");
      setTypingUsers(new Set());
      s.emit("offline");
    };
  }, [token]);

  /* ─── data loaders ────────────────────────────────────────────────────────── */
  async function loadConversations() {
    try {
      const data = await api("/conversations", { token });
      setConversations(data.conversations ?? []);
      const counts = {};
      for (const c of data.conversations ?? []) {
        const uc = c.unreadCounts?.[user?.id] || 0;
        if (uc > 0) counts[c._id] = uc;
      }
      setUnreadCounts(counts);
    } catch {} finally { setLoading(false); }
  }

  async function loadMessages(id, before) {
    try {
      const params = new URLSearchParams();
      if (before) params.set("before", before);
      const qs = params.toString();
      const data = await api(`/messages/${id}${qs ? `?${qs}` : ""}`, { token });
      const msgs = data.messages ?? [];
      setMessages((prev) => {
        if (!before) return msgs;
        const existing = new Set(prev.map((m) => m._id));
        return [...msgs.filter((m) => !existing.has(m._id)), ...prev];
      });
      if (!before) setHasMore(data.hasMore !== false);
      else setHasMore(data.hasMore !== false);
      if (!before) {
        decryptedTextCache.current = {};
        setMatchingMessageIds(null);
        setMessageSearchQuery("");
      }
    } catch { setMessages([]); }
  }

  async function loadOlderMessages() {
    if (!conversationId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const oldest = messages[0]?._id;
    if (!oldest) { setLoadingMore(false); return; }
    const prev = messages.length;
    await loadMessages(conversationId, oldest);
    setLoadingMore(false);
  }

  async function markConversationRead(cid) {
    try {
      await api(`/conversations/${cid}/read`, { method: "PATCH", token });
      setUnreadCounts((p) => ({ ...p, [cid]: 0 }));
      const s = socketRef.current;
      if (s) { s.emit("markRead", { conversationId: cid }); s.emit("joinConversation", cid); }
    } catch {}
  }

  async function markMessageDelivered(msgId) {
    try { await api(`/messages/${msgId}/delivered`, { method: "PATCH", token }); } catch {}
  }

  /* ─── decrypt ────────────────────────────────────────────────────────────── */
  const handleDecryptMessage = useCallback(
    async (message) => {
      if (!e2eeReady) return "…";
      if (!message.encryptedPayload) return message.body || "";
      if (!message.iv || !message.authTag) return "⚠️ Decryption failed";
      const counter = message.metadata?.counter ?? 0;
      let peerId = message.senderId;
      if (message.senderId === user?.id) {
        let peer = otherParticipant(activeConversation);
        if (!peer) {
          const fc = conversationsRef.current.find((c) => c._id === message.conversationId);
          peer = otherParticipant(fc);
        }
        if (!peer) return message.body || "";
        peerId = peer._id;
      }
      const secret = await getSharedSecret(peerId);
      if (!secret) return "⚠️ Cannot decrypt — key unavailable";
      try {
        return await decryptMessage(secret, message.encryptedPayload, message.iv, message.authTag, message.conversationId, counter);
      } catch {
        if (peerPublicKeysRef.current[peerId]) {
          delete peerPublicKeysRef.current[peerId];
          const staleKey = [user.id, peerId].sort().join(":");
          await Promise.all([removeKey(`sharedSecret:${staleKey}`, user.id), removeKey(`sharedSecretPubKey:${staleKey}`, user.id)]);
          const retrySecret = await getSharedSecret(peerId);
          if (retrySecret) {
            try { return await decryptMessage(retrySecret, message.encryptedPayload, message.iv, message.authTag, message.conversationId, counter); } catch {}
          }
        }
        return "⚠️ Decryption failed";
      }
    },
    [user?.id, e2eeReady, activeConversation]
  );

  const handleDecryptAttachment = useCallback(
    async (message, att) => {
      if (!e2eeReady || !att.fileIv || !att.fileAuthTag) {
        console.log("[decryptAttachment] skipped — e2eeReady=%s fileIv=%s fileAuthTag=%s", e2eeReady, !!att.fileIv, !!att.fileAuthTag);
        return att.url;
      }
      const counter = message.metadata?.counter ?? 0;
      let peerId = message.senderId;
      if (message.senderId === user?.id) {
        let peer = otherParticipant(activeConversation);
        if (!peer) { const fc = conversationsRef.current.find((c) => c._id === message.conversationId); peer = otherParticipant(fc); }
        if (!peer) { console.log("[decryptAttachment] no peer found for own message"); return null; }
        peerId = peer._id;
      }
      const secret = await getSharedSecret(peerId);
      if (!secret) { console.log("[decryptAttachment] getSharedSecret returned null for peer", peerId); return null; }
      let resp;
      try { resp = await fetch(att.url); } catch (e) { console.log("[decryptAttachment] fetch failed:", e.message); return null; }
      const buf = await resp.arrayBuffer();
      const b64url = base64Url(new Uint8Array(buf));
      const tryDecrypt = async (s, c) => URL.createObjectURL(await decryptFile(s, b64url, att.fileIv, att.fileAuthTag, message.conversationId, c));
      const tryOne = async (s, c) => { try { return await tryDecrypt(s, c); } catch (e) { console.log("[decryptAttachment] counter=%d failed: %s", c, e.message); return null; } };
      const first = await tryOne(secret, counter);
      if (first) return first;
      for (let c = 0; c <= 5; c++) {
        if (c === counter) continue;
        const r = await tryOne(secret, c);
        if (r) return r;
      }
      if (peerPublicKeysRef.current[peerId]) {
        delete peerPublicKeysRef.current[peerId];
        const sk = [user.id, peerId].sort().join(":");
        await Promise.all([removeKey(`sharedSecret:${sk}`, user.id), removeKey(`sharedSecretPubKey:${sk}`, user.id)]);
        const rs = await getSharedSecret(peerId);
        if (rs) { const r2 = await tryOne(rs, counter); if (r2) return r2; for (let c = 0; c <= 5; c++) { if (c === counter) continue; const r = await tryOne(rs, c); if (r) return r; } }
      }
      console.log("[decryptAttachment] all attempts failed for msg", message._id);
      return null;
    },
    [user?.id, e2eeReady, activeConversation]
  );

  /* ─── send (with debounce/lock) ───────────────────────────────────────────── */
  async function handleSend() {
    if (sendingRef.current || !body.trim() || !conversationId) return;
    sendingRef.current = true;
    setIsSending(true);

    const plaintext = body.trim();
    const counter = ++messageCounterRef.current;
    const tempId = `temp-${counter}`;
    const replyToId = replyTarget?._id;

    setBody("");
    setReplyTarget(null);
    setMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        body: plaintext,
        senderId: user.id,
        conversationId,
        createdAt: new Date().toISOString(),
      },
    ]);

    const peer = otherParticipant(activeConversation);
    const secret = peer ? await getSharedSecret(peer._id) : null;

    try {
      const payload = { conversationId, replyTo: replyToId || undefined };
      if (secret) {
        const enc = await encryptMessage(secret, plaintext, conversationId, counter);
        payload.encryptedPayload = enc.encryptedPayload;
        payload.iv = enc.iv;
        payload.authTag = enc.authTag;
        payload.metadata = { counter };
      } else {
        payload.body = plaintext;
      }
      const response = await api("/messages", { method: "POST", body: JSON.stringify(payload), token });
      setMessages((prev) => {
        if (prev.some((m) => m._id === response.message._id))
          return prev.filter((m) => m._id !== tempId);
        return prev.map((m) => (m._id === tempId ? { ...response.message, body: plaintext } : m));
      });
      textareaRef.current?.focus();
    } catch (err) {
      console.error("sendMessage:", err.message);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      toast.error("Failed to send message");
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  /* ─── search ──────────────────────────────────────────────────────────────── */
  async function handleSearch(q) {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const data = await api(`/users/search?q=${encodeURIComponent(q)}`, { token });
      setSearchResults(data.users ?? []);
    } catch { setSearchResults([]); }
  }

  async function startConversation(targetUserId) {
    try {
      const data = await api("/conversations", {
        method: "POST",
        body: JSON.stringify({ participants: [user.id, targetUserId] }),
        token,
      });
      setShowSearch(false); setSearchQuery(""); setSearchResults([]);
      loadConversations();
      navigate(`/chat/${data.conversation._id}`);
    } catch (err) {
      toast.error("Failed to start conversation");
    }
  }

  async function handleSendFriendRequest(recipientId) {
    try {
      await api("/friends/request", { method: "POST", body: JSON.stringify({ recipientId }), token });
      toast.success("Friend request sent");
    } catch { toast.error("Failed to send friend request"); }
  }

  /* ─── other actions ───────────────────────────────────────────────────────── */
  function handleReply(msg) {
    const peer = otherParticipant(activeConversation);
    const senderName = msg.senderId === user.id ? "You" : peer?.profile?.name || "User";
    setReplyTarget({ ...msg, senderName });
  }

  async function handleDelete(msg) {
    if (!msg._id) return;
    try {
      await api(`/messages/${msg._id}/delete`, { method: "POST", token });
      setMessages((p) => p.map((m) => m._id === msg._id ? { ...m, deletedAt: new Date().toISOString() } : m));
    } catch { toast.error("Failed to delete message"); }
  }

  async function handlePin(msg) {
    if (!conversationId || !msg._id) return;
    const isPinned = pinnedMessages.some((p) => (p.messageId?._id || p.messageId) === msg._id);
    try {
      await api(`/conversations/${conversationId}/${isPinned ? "unpin" : "pin"}/${msg._id}`, { method: "PATCH", token });
      loadConversations();
    } catch { toast.error("Failed to pin message"); }
  }

  async function handleForwardSend(targetConversationId) {
    const msg = forwardTarget;
    if (!msg) return;
    const targetConv = conversations.find((c) => c._id === targetConversationId);
    const peer = targetConv?.participants?.find((p) => p._id !== user.id) ?? targetConv?.participants?.[0];
    if (!peer) { toast.error("Cannot forward — no peer found"); return; }
    let text = decryptedTextCache.current[msg._id];
    if (text === undefined) {
      try { text = await handleDecryptMessage(msg); } catch { text = msg.body || ""; }
      decryptedTextCache.current[msg._id] = text;
    }
    if (!text) { toast.error("Cannot forward encrypted media"); setForwardTarget(null); return; }
    const secret = await getSharedSecret(peer._id);
    const counter = ++messageCounterRef.current;
    try {
      const payload = { conversationId: targetConversationId, forwardedFrom: msg._id };
      if (secret && msg.encryptedPayload) {
        const enc = await encryptMessage(secret, text, targetConversationId, counter);
        payload.encryptedPayload = enc.encryptedPayload; payload.iv = enc.iv; payload.authTag = enc.authTag; payload.metadata = { counter };
      } else { payload.body = text; }
      await api("/messages", { method: "POST", body: JSON.stringify(payload), token });
      toast.success("Message forwarded");
    } catch { toast.error("Failed to forward message"); }
    setForwardTarget(null);
  }

  async function handleSetDisappear(duration) {
    if (!conversationId) return;
    try {
      await api(`/conversations/${conversationId}/disappear`, { method: "PATCH", body: JSON.stringify({ duration }), token });
      loadConversations();
    } catch { toast.error("Failed to update disappearing messages"); }
  }

  async function handleClearHistory() {
    if (!conversationId) return;
    try {
      await api(`/conversations/${conversationId}/clear`, { method: "POST", token });
      setMessages([]);
    } catch { toast.error("Failed to clear history"); }
  }

  async function handleMessageSearch(query) {
    setMessageSearchQuery(query);
    if (!query.trim()) { setMatchingMessageIds(null); return; }
    const q = query.toLowerCase();
    const matched = new Set();
    for (const msg of messages) {
      if (msg.deletedAt) continue;
      let text = decryptedTextCache.current[msg._id];
      if (text === undefined) {
        if (msg.encryptedPayload) { try { text = await handleDecryptMessage(msg); } catch { text = ""; } }
        else { text = msg.body || ""; }
        decryptedTextCache.current[msg._id] = text;
      }
      if (text && text.toLowerCase().includes(q)) matched.add(msg._id);
    }
    setMatchingMessageIds(matched);
  }

  const emitTyping = useCallback((isTyping) => {
    const cid = conversationIdRef.current;
    if (!cid || !socketRef.current) return;
    socketRef.current.emit(isTyping ? "typing:start" : "typing:stop", { conversationId: cid });
  }, []);

  async function handleUploadFile(file, type = "file") {
    if (!conversationId) return;
    const peer = otherParticipant(activeConversation);
    const secret = peer ? await getSharedSecret(peer._id) : null;
    const counter = ++messageCounterRef.current;
    try {
      let attachment; let metadata = {};
      if (secret) {
        const ef = await encryptFile(secret, file, conversationId, counter);
        const stdB64 = ef.encryptedPayload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = stdB64.padEnd(Math.ceil(stdB64.length / 4) * 4, "=");
        const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "application/octet-stream" });
        const fd = new FormData(); fd.append("file", blob, file.name);
        const r = await fetch(`${API_URL}/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
        const d = await r.json(); if (!r.ok) throw new Error(d.error || "Upload failed");
        attachment = { type: type === "image" ? "image" : "file", url: d.file.url, name: file.name, size: file.size, fileIv: ef.iv, fileAuthTag: ef.authTag };
        metadata = { counter };
      } else {
        const fd = new FormData(); fd.append("file", file);
        const r = await fetch(`${API_URL}/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
        const d = await r.json(); if (!r.ok) throw new Error(d.error || "Upload failed");
        attachment = { type: type === "image" ? "image" : "file", url: d.file.url, name: d.file.name, size: d.file.size };
      }
      const response = await api("/messages", { method: "POST", body: JSON.stringify({ conversationId, attachments: [attachment], metadata }), token });
      setMessages((p) => p.some((m) => m._id === response.message._id) ? p : [...p, response.message]);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err?.message || "Failed to upload file");
    }
  }

  /* ─── derived ────────────────────────────────────────────────────────────── */
  const peerUser = otherParticipant(activeConversation);
  const isPeerOnline = onlineUsers.has(peerUser?._id);
  const peerName = peerUser?.profile?.name || peerUser?.username || "Unknown";

  const typingNames = useMemo(() => {
    if (!typingUsers.size || !activeConversation?.participants) return [];
    return [...typingUsers]
      .map((uid) => activeConversation.participants.find((p) => p._id === uid)?.profile?.name)
      .filter(Boolean);
  }, [typingUsers, activeConversation?.participants]);

  const displayMessages =
    matchingMessageIds && messageSearchQuery.trim()
      ? messages.filter((m) => matchingMessageIds.has(m._id))
      : messages;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const showSidebar = !conversationId || !isMobile;
  const showChat = conversationId || !isMobile;

  /* ─── render ─────────────────────────────────────────────────────────────── */
  return (
    <div style={S.root}>
      {/* ── SIDEBAR ── */}
      <div
        style={{
          ...S.sidebar,
          ...(conversationId && isMobile ? S.sidebarHidden : {}),
        }}
        className="chat-sidebar"
      >
        {showFriends ? (
          <FriendRequests onBack={() => setShowFriends(false)} />
        ) : showSearch ? (
          <AddFriend
            show={showSearch}
            onToggle={() => setShowSearch(false)}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            searchResults={searchResults}
            onStartConversation={startConversation}
            onSendFriendRequest={handleSendFriendRequest}
            onShowFriends={() => setShowFriends(true)}
            friendRequestCount={friendRequestCount}
          />
        ) : (
          <>
            {/* Header */}
            <div style={S.sidebarHeader}>
              <p style={S.sidebarTitle}>Messages</p>
              <div style={{ display: "flex", gap: "4px" }}>
                {friendRequestCount > 0 && (
                  <button
                    style={{ ...S.iconBtn, position: "relative" }}
                    onClick={() => setShowFriends(true)}
                    title="Friend requests"
                  >
                    <Users size={17} />
                    <span style={{
                      position: "absolute", top: "4px", right: "4px",
                      background: "#dc2626", color: "#fff", fontSize: "9px",
                      fontWeight: 700, borderRadius: "10px", padding: "0 3px",
                      minWidth: "14px", textAlign: "center",
                    }}>
                      {friendRequestCount}
                    </span>
                  </button>
                )}
                <button style={S.iconBtn} onClick={() => setShowSearch(true)} title="New message">
                  <UserPlus size={17} />
                </button>
              </div>
            </div>

            {/* Search bar */}
            <div style={{ ...S.searchWrap, position: "relative" }}>
              <span style={S.searchIconWrap}><Search size={14} /></span>
              <input
                style={S.searchInput}
                placeholder="Search conversations…"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {/* Conversation list */}
            <div style={S.convListWrap}>
              {loading ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#555", fontSize: "13px" }}>
                  Loading…
                </div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "#555", fontSize: "13px" }}>
                  No conversations yet.<br />
                  <span style={{ color: "#2563eb", cursor: "pointer" }} onClick={() => setShowSearch(true)}>
                    Start one
                  </span>
                </div>
              ) : (
                conversations.map((conv) => {
                  const peer = conv.participants?.find((p) => p._id !== user?.id) ?? conv.participants?.[0];
                  const name = peer?.profile?.name || peer?.username || "Unknown";
                  const initials = getInitials(name);
                  const isActive = conv._id === conversationId;
                  const isOnline = onlineUsers.has(peer?._id);
                  const unread = unreadCounts[conv._id] || 0;
                  const lastMsg = conv.lastMessage?.body || (conv.lastMessage?.attachments?.length ? "📎 Attachment" : "");

                  return (
                    <div
                      key={conv._id}
                      style={{
                        ...S.convItem,
                        background: isActive ? "#1c1c1c" : "transparent",
                      }}
                      onClick={() => navigate(`/chat/${conv._id}`)}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#161616"; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={S.avatar}>
                        {peer?.profile?.avatarUrl ? (
                          <img src={peer.profile.avatarUrl} alt={initials} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                        ) : initials}
                        {isOnline && <span style={S.onlineDot} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={S.convName}>{name}</p>
                        {lastMsg && <p style={S.convLast}>{lastMsg}</p>}
                      </div>
                      {unread > 0 && <span style={S.unreadBadge}>{unread}</span>}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* ── CHAT AREA ── */}
      <div
        style={{
          ...S.chatArea,
          ...(!conversationId && isMobile ? S.chatAreaHidden : {}),
        }}
        className="chat-main"
      >
        {conversationId && activeConversation ? (
          <>
            <ChatHeader
              conversation={activeConversation}
              currentUserId={user.id}
              isOnline={isPeerOnline}
              onBack={() => navigate("/chat")}
              onVoiceCall={(peerId, name) => startCall(peerId, "voice", name)}
              onVideoCall={(peerId, name) => startCall(peerId, "video", name)}
              onClearHistory={handleClearHistory}
              onSearch={handleMessageSearch}
              disappearDuration={activeConversation?.disappearDuration ?? 0}
              onSetDisappear={handleSetDisappear}
            />

            <MessageList
              messages={displayMessages}
              currentUserId={user.id}
              participants={activeConversation?.participants}
              decryptMessage={handleDecryptMessage}
              decryptAttachment={handleDecryptAttachment}
              onReply={handleReply}
              onDelete={handleDelete}
              isSearching={!!messageSearchQuery}
              pinnedMessages={pinnedMessages}
              onPin={handlePin}
              onForward={(msg) => setForwardTarget(msg)}
              onLoadOlder={loadOlderMessages}
              hasMore={hasMore}
              loadingMore={loadingMore}
            />

            {/* Typing indicator */}
            {typingNames.length > 0 && (
              <div style={S.typingWrap}>
                {typingNames.join(", ")} {typingNames.length === 1 ? "is" : "are"} typing…
              </div>
            )}

            {/* Message input */}
            <div style={S.inputArea}>
              {replyTarget && (
                <div style={S.replyPreview}>
                  <Reply size={14} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {replyTarget.senderName}: {replyTarget.body || "Message"}
                  </span>
                  <button
                    style={{ ...S.iconBtn, width: "20px", height: "20px", borderRadius: "4px" }}
                    onClick={() => setReplyTarget(null)}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <div style={S.inputRow}>
                {/* Attach image */}
                <label
                  style={{ ...S.iconBtn, cursor: "pointer" }}
                  title="Send image"
                >
                  <ImageIcon size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadFile(f, "image");
                      e.target.value = "";
                    }}
                  />
                </label>

                {/* Emoji picker */}
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((v) => !v)}
                    style={S.iconBtn}
                    title="Emoji picker"
                  >
                    <Smile size={16} />
                  </button>
                  {showEmojiPicker && (
                    <div style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: 8, zIndex: 50 }}>
                      <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                    </div>
                  )}
                </div>

                {/* Text input */}
                <textarea
                  ref={textareaRef}
                  style={S.textarea}
                  placeholder={e2eeReady ? "Type a message…" : "Setting up encryption…"}
                  value={body}
                  disabled={!e2eeReady}
                  rows={1}
                  onChange={(e) => {
                    setBody(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    emitTyping(!!e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  onBlur={() => emitTyping(false)}
                />

                {/* Send */}
                <button
                  style={{
                    ...S.sendBtn,
                    ...((!body.trim() || !e2eeReady || isSending) ? S.sendBtnDisabled : {}),
                  }}
                  onClick={handleSend}
                  disabled={!body.trim() || !e2eeReady || isSending}
                  title="Send"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div style={S.empty}>
            <MessageCircle size={48} style={S.emptyIcon} color="#888" />
            <p style={S.emptyText}>Select a conversation to start chatting</p>
          </div>
        )}
      </div>

      {/* Forward dialog */}
      {forwardTarget && (
        <ForwardDialog
          conversations={conversations}
          currentConversationId={conversationId}
          onForward={handleForwardSend}
          onClose={() => setForwardTarget(null)}
        />
      )}

      {/* Responsive CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

        * { box-sizing: border-box; }

        .chat-sidebar::-webkit-scrollbar,
        .chat-main::-webkit-scrollbar { width: 4px; }
        .chat-sidebar::-webkit-scrollbar-track,
        .chat-main::-webkit-scrollbar-track { background: transparent; }
        .chat-sidebar::-webkit-scrollbar-thumb,
        .chat-main::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }

        @media (max-width: 768px) {
          .chat-sidebar {
            width: 100% !important;
            min-width: 100% !important;
            display: ${conversationId ? "none" : "flex"} !important;
          }
          .chat-main {
            display: ${conversationId ? "flex" : "none"} !important;
          }
        }
      `}</style>
    </div>
  );
}