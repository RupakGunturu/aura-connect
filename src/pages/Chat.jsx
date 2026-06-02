import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { MessageCircle } from "lucide-react";
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
} from "@/lib/e2ee";
import { storeKey, getKey, removeKey, setCurrentUser, clearAllKeys } from "@/lib/keyStore";
import ConversationList from "@/components/chat/ConversationList";
import AddFriend from "@/components/chat/AddFriend";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import ForwardDialog from "@/components/chat/ForwardDialog";
import FriendRequests from "@/components/chat/FriendRequests";
import TypingIndicator from "@/components/chat/TypingIndicator";
import { requestNotificationPermission, showNotification, playMessageSound } from "@/lib/notifications";

function uid(key) {
  return (u) => `${u}:${key}`;
}
const USER_ID_KEY = "userId";
const PRIVATE_KEY_FN = uid("privateKey");
const PUBLIC_KEY_FN = uid("publicKey");

export default function Chat() {
  const { user, token } = useAuth();
  const { startCall } = useCall();
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const [forwardTarget, setForwardTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showFriends, setShowFriends] = useState(false);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [matchingMessageIds, setMatchingMessageIds] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});
  const [e2eeReady, setE2eeReady] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());

  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  const sharedSecretsRef = useRef({});
  const pendingSecretsRef = useRef({});
  const peerPublicKeysRef = useRef({});
  const socketRef = useRef(null);
  const messageCounterRef = useRef(0);
  const decryptedTextCache = useRef({});

  const activeConversation = conversations.find((c) => c._id === conversationId);

  function otherParticipant(conversation) {
    return (
      conversation?.participants?.find((p) => p._id !== user?.id) ?? conversation?.participants?.[0]
    );
  }

  async function initE2EE() {
    try {
      setCurrentUser(user.id);
      const storedUserId = await getKey(USER_ID_KEY, user.id);
      if (storedUserId !== user.id) {
        sharedSecretsRef.current = {};
        await clearAllKeys();
        const kp = generateKeyPair();
        await storeKey(USER_ID_KEY, user.id, user.id);
        await storeKey(PRIVATE_KEY_FN(user.id), kp.privateKey, user.id);
        await storeKey(PUBLIC_KEY_FN(user.id), kp.publicKey, user.id);
        await api("/users/me/public-key", {
          method: "PUT",
          body: JSON.stringify({ publicKey: kp.publicKey }),
          token,
        });
      } else {
        const pubKey = await getKey(PUBLIC_KEY_FN(user.id), user.id);
        if (pubKey) {
          try {
            await api("/users/me/public-key", {
              method: "PUT",
              body: JSON.stringify({ publicKey: pubKey }),
              token,
            });
          } catch {
            // server might reject if unchanged, ignore
          }
        }
      }
      setE2eeReady(true);
    } catch (err) {
      console.error("E2EE init failed", err);
      toast.error("Encryption setup failed. Messages will not be encrypted.");
    }
  }

  async function getSharedSecret(peerId) {
    if (pendingSecretsRef.current[peerId]) {
      return pendingSecretsRef.current[peerId];
    }

    const promise = (async () => {
      try {
        let peerPubKey = peerPublicKeysRef.current[peerId];
        const indexKey = [user.id, peerId].sort().join(":");

        if (peerPubKey) {
          const cacheKey = [user.id, peerId, peerPubKey].join(":");
          if (sharedSecretsRef.current[cacheKey]) return sharedSecretsRef.current[cacheKey];

          const [cachedSecret, cachedPubKey] = await Promise.all([
            getKey(`sharedSecret:${indexKey}`, user.id),
            getKey(`sharedSecretPubKey:${indexKey}`, user.id),
          ]);
          if (cachedSecret && cachedPubKey === peerPubKey) {
            sharedSecretsRef.current[cacheKey] = cachedSecret;
            return cachedSecret;
          }
        } else {
          const [cachedSecret, cachedPubKey] = await Promise.all([
            getKey(`sharedSecret:${indexKey}`, user.id),
            getKey(`sharedSecretPubKey:${indexKey}`, user.id),
          ]);
          if (cachedSecret && cachedPubKey) {
            peerPublicKeysRef.current[peerId] = cachedPubKey;
            const cacheKey = [user.id, peerId, cachedPubKey].join(":");
            sharedSecretsRef.current[cacheKey] = cachedSecret;
            return cachedSecret;
          }
        }

        if (!peerPubKey) {
          const res = await api(`/users/${peerId}/public-key`, { token });
          peerPubKey = res.publicKey;
          if (!peerPubKey) {
            toast.error(`User has no public key — messages won't be encrypted`);
            return null;
          }
          peerPublicKeysRef.current[peerId] = peerPubKey;
        }

        const cacheKey = [user.id, peerId, peerPubKey].join(":");
        if (sharedSecretsRef.current[cacheKey]) return sharedSecretsRef.current[cacheKey];

        const [cachedSecret, cachedPubKey] = await Promise.all([
          getKey(`sharedSecret:${indexKey}`, user.id),
          getKey(`sharedSecretPubKey:${indexKey}`, user.id),
        ]);
        if (cachedSecret && cachedPubKey === peerPubKey) {
          sharedSecretsRef.current[cacheKey] = cachedSecret;
          return cachedSecret;
        }

        const privKey = await getKey(PRIVATE_KEY_FN(user.id), user.id);
        if (!privKey) {
          toast.error("Your encryption key is missing. Re-login to generate a new one.");
          return null;
        }
        const secret = deriveSharedSecret(privKey, peerPubKey);
        sharedSecretsRef.current[cacheKey] = secret;
        await Promise.all([
          storeKey(`sharedSecret:${indexKey}`, secret, user.id),
          storeKey(`sharedSecretPubKey:${indexKey}`, peerPubKey, user.id),
        ]);
        return secret;
      } catch (err) {
        console.error("Failed to get shared secret", err);
        return null;
      }
    })();

    pendingSecretsRef.current[peerId] = promise;
    try {
      return await promise;
    } finally {
      delete pendingSecretsRef.current[peerId];
    }
  }

  useEffect(() => {
    if (user?.id) initE2EE();
    requestNotificationPermission();
  }, [user?.id]);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
      markConversationRead(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    if (activeConversation?.pinned) {
      setPinnedMessages(activeConversation.pinned);
    } else {
      setPinnedMessages([]);
    }
  }, [activeConversation?.pinned]);

  useEffect(() => {
    const s = connectSocket(token);
    socketRef.current = s;

    s.on("userOnline", ({ userId }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    });
    s.on("userOffline", ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });
    s.on("friendRequestReceived", ({ senderName }) => {
      setFriendRequestCount((c) => c + 1);
      showNotification("Friend Request", {
        body: `${senderName || "Someone"} sent you a friend request`,
      });
    });
    s.on("friendRequestAccepted", () => {
      toast.success("Friend request accepted!");
    });
    s.on("messagePinned", ({ messageId }) => {
      loadConversations();
    });
    s.on("messageUnpinned", ({ messageId }) => {
      loadConversations();
    });
    s.on("messageDeleted", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, deletedAt: new Date().toISOString() } : m)),
      );
    });
    s.on("conversationRead", ({ conversationId: cid }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.conversationId === cid && m.senderId !== user?.id ? { ...m, read: true } : m,
        ),
      );
    });

    s.on("typing:start", ({ userId: typingUserId, userName }) => {
      if (typingUserId === user?.id) return;
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.add(typingUserId);
        return next;
      });
    });

    s.on("typing:stop", ({ userId: typingUserId }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(typingUserId);
        return next;
      });
    });

    function onMessage(msg) {
      if (msg.conversationId !== conversationId && msg.senderId !== user?.id) {
        playMessageSound();
        showNotification("New message", {
          body: msg.body || "Encrypted message",
          onClick: () => navigate(`/chat/${msg.conversationId}`),
        });
      }
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        if (msg.conversationId === conversationId) {
          markMessageDelivered(msg._id);
          return [...prev, msg];
        }
        return prev;
      });
      setConversations((prev) => {
        const existing = prev.find((c) => c._id === msg.conversationId);
        if (existing) {
          return prev.map((c) => (c._id === msg.conversationId ? { ...c, lastMessage: msg } : c));
        }
        return prev;
      });
      if (msg.conversationId !== conversationId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.conversationId]: (prev[msg.conversationId] || 0) + 1,
        }));
      }
    }
    s.on("message", onMessage);

    s.emit("online");

    return () => {
      s.off("userOnline");
      s.off("userOffline");
      s.off("conversationRead");
      s.off("message", onMessage);
      s.off("typing:start");
      s.off("typing:stop");
      setTypingUsers(new Set());
      s.emit("offline");
    };
  }, [token, conversationId]);

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
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(id) {
    try {
      const data = await api(`/messages/${id}`, { token });
      setMessages(data.messages ?? []);
      decryptedTextCache.current = {};
      setMatchingMessageIds(null);
      setMessageSearchQuery("");
    } catch {
      setMessages([]);
    }
  }

  async function markConversationRead(cid) {
    try {
      await api(`/conversations/${cid}/read`, { method: "PATCH", token });
      setUnreadCounts((prev) => ({ ...prev, [cid]: 0 }));
      const s = socketRef.current;
      if (s) {
        s.emit("markRead", { conversationId: cid });
        s.emit("joinConversation", cid);
      }
    } catch {
      // ignore
    }
  }

  async function markMessageDelivered(msgId) {
    try {
      await api(`/messages/${msgId}/delivered`, { method: "PATCH", token });
    } catch {
      // ignore
    }
  }

  async function handleSearch(q) {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await api(`/users/search?q=${encodeURIComponent(q)}`, { token });
      setSearchResults(data.users ?? []);
    } catch {
      setSearchResults([]);
    }
  }

  async function startConversation(targetUserId) {
    try {
      const data = await api("/conversations", {
        method: "POST",
        body: JSON.stringify({ participants: [user.id, targetUserId] }),
        token,
      });
      setShowSearch(false);
      setSearchQuery("");
      setSearchResults([]);
      loadConversations();
      navigate(`/chat/${data.conversation._id}`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSend() {
    if (!body.trim() || !conversationId) return;

    const plaintext = body.trim();
    const peer = otherParticipant(activeConversation);
    const secret = peer ? await getSharedSecret(peer._id) : null;
    const counter = ++messageCounterRef.current;

    try {
      let response;
      const payload = {
        conversationId,
        replyTo: replyTarget?._id || undefined,
      };
      if (secret) {
        const encrypted = await encryptMessage(secret, plaintext, conversationId, counter);
        payload.encryptedPayload = encrypted.encryptedPayload;
        payload.iv = encrypted.iv;
        payload.authTag = encrypted.authTag;
        payload.metadata = { counter };
      } else {
        payload.body = plaintext;
      }
      response = await api("/messages", {
        method: "POST",
        body: JSON.stringify(payload),
        token,
      });
      setMessages((prev) => {
        const newMsg = { ...response.message, body: plaintext };
        return prev.some((m) => m._id === response.message._id)
          ? prev.map((m) => (m._id === response.message._id ? newMsg : m))
          : [...prev, newMsg];
      });
      setBody("");
      setReplyTarget(null);
    } catch (err) {
      toast.error(err.message);
    }
  }

  function handleForwardClick(msg) {
    setForwardTarget(msg);
  }

  async function handleForwardSend(targetConversationId) {
    const msg = forwardTarget;
    if (!msg) return;

    const targetConv = conversations.find((c) => c._id === targetConversationId);
    const peer = targetConv?.participants?.find((p) => p._id !== user.id) ?? targetConv?.participants?.[0];
    if (!peer) {
      toast.error("Cannot forward — no peer found");
      return;
    }

    let text = decryptedTextCache.current[msg._id];
    if (text === undefined) {
      try {
        text = await handleDecryptMessage(msg);
      } catch {
        text = msg.body || "";
      }
      decryptedTextCache.current[msg._id] = text;
    }
    if (!text) {
      toast.error("Cannot forward encrypted media");
      setForwardTarget(null);
      return;
    }

    const secret = await getSharedSecret(peer._id);
    const counter = ++messageCounterRef.current;

    try {
      const payload = { conversationId: targetConversationId, forwardedFrom: msg._id };
      if (secret && msg.encryptedPayload) {
        const encrypted = await encryptMessage(secret, text, targetConversationId, counter);
        payload.encryptedPayload = encrypted.encryptedPayload;
        payload.iv = encrypted.iv;
        payload.authTag = encrypted.authTag;
        payload.metadata = { counter };
      } else {
        payload.body = text;
      }
      await api("/messages", { method: "POST", body: JSON.stringify(payload), token });
      toast.success("Message forwarded");
    } catch (err) {
      toast.error(err.message);
    }
    setForwardTarget(null);
  }

  function handleReply(msg) {
    const peer = otherParticipant(activeConversation);
    const senderName = msg.senderId === user.id ? "You" : peer?.profile?.name || "User";
    setReplyTarget({ ...msg, senderName });
  }

  async function handleMessageSearch(query) {
    setMessageSearchQuery(query);
    if (!query.trim()) {
      setMatchingMessageIds(null);
      return;
    }

    const q = query.toLowerCase();
    const matched = new Set();

    for (const msg of messages) {
      if (msg.deletedAt) continue;
      let text = decryptedTextCache.current[msg._id];
      if (text === undefined) {
        if (msg.encryptedPayload) {
          try {
            text = await handleDecryptMessage(msg);
          } catch {
            text = "";
          }
        } else {
          text = msg.body || "";
        }
        decryptedTextCache.current[msg._id] = text;
      }
      if (text && text.toLowerCase().includes(q)) {
        matched.add(msg._id);
      }
    }
    setMatchingMessageIds(matched);
  }

  async function handleSendFriendRequest(recipientId) {
    try {
      await api("/friends/request", {
        method: "POST",
        body: JSON.stringify({ recipientId }),
        token,
      });
      toast.success("Friend request sent");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSetDisappear(duration) {
    if (!conversationId) return;
    try {
      await api(`/conversations/${conversationId}/disappear`, {
        method: "PATCH",
        body: JSON.stringify({ duration }),
        token,
      });
      loadConversations();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleClearHistory() {
    if (!conversationId) return;
    try {
      await api(`/conversations/${conversationId}/clear`, { method: "POST", token });
      setMessages([]);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handlePin(msg) {
    if (!conversationId || !msg._id) return;
    const isPinned = pinnedMessages.some((p) => (p.messageId?._id || p.messageId) === msg._id);
    try {
      if (isPinned) {
        await api(`/conversations/${conversationId}/unpin/${msg._id}`, { method: "PATCH", token });
      } else {
        await api(`/conversations/${conversationId}/pin/${msg._id}`, { method: "PATCH", token });
      }
      loadConversations();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDelete(msg) {
    if (!msg._id) return;
    try {
      await api(`/messages/${msg._id}/delete`, { method: "POST", token });
      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? { ...m, deletedAt: new Date().toISOString() } : m)),
      );
    } catch (err) {
      toast.error(err.message);
    }
  }

  const emitTyping = useCallback((isTyping) => {
    const cid = conversationIdRef.current;
    if (!cid || !socketRef.current) return;
    socketRef.current.emit(isTyping ? "typing:start" : "typing:stop", { conversationId: cid });
  }, []);

  const handleDecryptAttachment = useCallback(
    async (message, att) => {
      if (!e2eeReady || !att.fileIv || !att.fileAuthTag) return att.url;
      const counter = message.metadata?.counter ?? 0;

      let peerId = message.senderId;
      if (message.senderId === user?.id) {
        let peer = otherParticipant(activeConversation);
        if (!peer) {
          const fallbackConv = conversationsRef.current.find((c) => c._id === message.conversationId);
          peer = otherParticipant(fallbackConv);
        }
        if (!peer) return null;
        peerId = peer._id;
      }

      const secret = await getSharedSecret(peerId);
      if (!secret) return null;

      const base64Part = att.url.split(",")[1];
      if (!base64Part) return null;
      const base64urlPayload = base64Part
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

      async function decryptWithSecret(s) {
        return URL.createObjectURL(
          await decryptFile(
            s, base64urlPayload, att.fileIv, att.fileAuthTag,
            message.conversationId, counter,
          ),
        );
      }

      try {
        return await decryptWithSecret(secret);
      } catch (err) {
        if (peerPublicKeysRef.current[peerId]) {
          delete peerPublicKeysRef.current[peerId];
          const staleIndexKey = [user.id, peerId].sort().join(":");
          await Promise.all([
            removeKey(`sharedSecret:${staleIndexKey}`, user.id),
            removeKey(`sharedSecretPubKey:${staleIndexKey}`, user.id),
          ]);
          const retrySecret = await getSharedSecret(peerId);
          if (retrySecret) {
            try {
              return await decryptWithSecret(retrySecret);
            } catch {}
          }
        }
        console.warn("attachment decrypt error:", err, { msgId: message._id });
        return null;
      }
    },
    [user?.id, e2eeReady, activeConversation],
  );

  const handleDecryptMessage = useCallback(
    async (message) => {
      if (!e2eeReady) return "...";
      if (!message.encryptedPayload) return message.body || "";

      if (!message.iv || !message.authTag) {
        console.debug("missing iv or authTag for encrypted message", { msgId: message._id });
        return "⚠️ Decryption failed";
      }

      const counter = message.metadata?.counter ?? 0;

      let peerId = message.senderId;
      if (message.senderId === user?.id) {
        let peer = otherParticipant(activeConversation);
        if (!peer) {
          const fallbackConv = conversationsRef.current.find((c) => c._id === message.conversationId);
          peer = otherParticipant(fallbackConv);
        }
        if (!peer) return message.body || "";
        peerId = peer._id;
      }

      const secret = await getSharedSecret(peerId);
      if (!secret) return "⚠️ Cannot decrypt — key unavailable";

      try {
        return await decryptMessage(
          secret,
          message.encryptedPayload,
          message.iv,
          message.authTag,
          message.conversationId,
          counter,
        );
      } catch (err) {
        if (peerPublicKeysRef.current[peerId]) {
          delete peerPublicKeysRef.current[peerId];
          const staleIndexKey = [user.id, peerId].sort().join(":");
          await Promise.all([
            removeKey(`sharedSecret:${staleIndexKey}`, user.id),
            removeKey(`sharedSecretPubKey:${staleIndexKey}`, user.id),
          ]);
          const retrySecret = await getSharedSecret(peerId);
          if (retrySecret) {
            try {
              return await decryptMessage(
                retrySecret,
                message.encryptedPayload,
                message.iv,
                message.authTag,
                message.conversationId,
                counter,
              );
            } catch {}
          }
        }
        console.debug("decrypt error:", err, { msgId: message._id });
        return "⚠️ Decryption failed";
      }
    },
    [user?.id, e2eeReady, activeConversation],
  );

  async function handleUploadFile(file, type = "file") {
    if (!conversationId) return;

    const peer = otherParticipant(activeConversation);
    const secret = peer ? await getSharedSecret(peer._id) : null;
    const counter = ++messageCounterRef.current;

    try {
      let attachment;
      let metadata = {};

      if (secret) {
        const encryptedFile = await encryptFile(secret, file, conversationId, counter);

        const standardB64 = encryptedFile.encryptedPayload
          .replace(/-/g, "+").replace(/_/g, "/");
        const padded = standardB64.padEnd(Math.ceil(standardB64.length / 4) * 4, "=");
        const encryptedBytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
        const encryptedBlob = new Blob([encryptedBytes], { type: "application/octet-stream" });

        const formData = new FormData();
        formData.append("file", encryptedBlob, file.name);
        const uploadRes = await fetch(`${API_URL}/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

        attachment = {
          type: type === "image" ? "image" : "file",
          url: uploadData.file.url,
          name: file.name,
          size: file.size,
          fileIv: encryptedFile.iv,
          fileAuthTag: encryptedFile.authTag,
        };
        metadata = { counter };
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch(`${API_URL}/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

        attachment = {
          type: type === "image" ? "image" : "file",
          url: uploadData.file.url,
          name: uploadData.file.name,
          size: uploadData.file.size,
        };
      }

      const response = await api("/messages", {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          attachments: [attachment],
          metadata,
        }),
        token,
      });
      setMessages((prev) =>
        prev.some((m) => m._id === response.message._id)
          ? prev
          : [...prev, response.message],
      );
    } catch (err) {
      toast.error(err.message);
    }
  }

  const peerUser = otherParticipant(activeConversation);
  const isPeerOnline = onlineUsers.has(peerUser?._id);

  const typingNames = useMemo(() => {
    if (!typingUsers.size || !activeConversation?.participants) return [];
    return [...typingUsers]
      .map((uid) => {
        const p = activeConversation.participants.find((part) => part._id === uid);
        return p?.profile?.name;
      })
      .filter(Boolean);
  }, [typingUsers, activeConversation?.participants]);
  const displayMessages =
    matchingMessageIds && messageSearchQuery.trim()
      ? messages.filter((m) => matchingMessageIds.has(m._id))
      : messages;

  return (
    <div className="flex h-full w-full">
      {showFriends ? (
        <div className="flex w-full flex-col border-r border-border md:w-80">
          <FriendRequests onBack={() => setShowFriends(false)} />
        </div>
      ) : showSearch ? (
        <div className="flex w-full flex-col border-r border-border md:w-80">
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
        </div>
      ) : (
        <div
          className={`flex flex-col border-r border-border ${
            conversationId ? "hidden md:flex md:w-80" : "w-full md:w-80"
          }`}
        >
          <AddFriend
            show={showSearch}
            onToggle={() => setShowSearch((v) => !v)}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            searchResults={searchResults}
            onStartConversation={startConversation}
            onSendFriendRequest={handleSendFriendRequest}
            onShowFriends={() => setShowFriends(true)}
            friendRequestCount={friendRequestCount}
          />
          <ConversationList
            conversations={conversations}
            activeId={conversationId}
            currentUserId={user?.id}
            onlineUsers={onlineUsers}
            unreadCounts={unreadCounts}
            onSelect={(id) => navigate(`/chat/${id}`)}
            loading={loading}
          />
        </div>
      )}

      <div className={`flex flex-1 flex-col ${conversationId ? "" : "hidden md:flex"}`}>
        {conversationId && activeConversation ? (
          <>
            <ChatHeader
              conversation={activeConversation}
              currentUserId={user?.id}
              isOnline={isPeerOnline}
              onBack={() => navigate("/chat")}
              onVoiceCall={(peerId, peerName) => startCall(peerId, "voice", peerName)}
              onVideoCall={(peerId, peerName) => startCall(peerId, "video", peerName)}
              onClearHistory={handleClearHistory}
              onSearch={handleMessageSearch}
              disappearDuration={activeConversation?.disappearDuration ?? 0}
              onSetDisappear={handleSetDisappear}
            />
            <MessageList
              messages={displayMessages}
              currentUserId={user?.id}
              decryptMessage={handleDecryptMessage}
              decryptAttachment={handleDecryptAttachment}
              onReply={handleReply}
              onDelete={handleDelete}
              onPin={handlePin}
              pinnedMessages={pinnedMessages}
              isSearching={!!messageSearchQuery.trim()}
              onForward={handleForwardClick}
            />
            <TypingIndicator names={typingNames} />
            <MessageInput
              value={body}
              onChange={setBody}
              onSend={handleSend}
              onUploadImage={(file) => handleUploadFile(file, "image")}
              onUploadFile={(file) => handleUploadFile(file, "file")}
              disabled={!e2eeReady}
              replyTarget={replyTarget}
              onCancelReply={() => setReplyTarget(null)}
              onTypingChange={emitTyping}
            />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center max-md:hidden">
            <MessageCircle className="mb-4 size-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Select a conversation to start chatting</p>
          </div>
        )}
      </div>

      {forwardTarget && (
        <ForwardDialog
          conversations={conversations}
          currentConversationId={conversationId}
          onForward={handleForwardSend}
          onClose={() => setForwardTarget(null)}
        />
      )}
    </div>
  );
}
