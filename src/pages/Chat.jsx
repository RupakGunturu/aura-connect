import { useState, useEffect, useCallback, useRef } from "react";
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
} from "@/lib/e2ee";
import { storeKey, getKey, removeKey, setCurrentUser, clearAllKeys } from "@/lib/keyStore";
import ConversationList from "@/components/chat/ConversationList";
import AddFriend from "@/components/chat/AddFriend";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});
  const [e2eeReady, setE2eeReady] = useState(false);

  const sharedSecretsRef = useRef({});
  const pendingSecretsRef = useRef({});
  const peerPublicKeysRef = useRef({});
  const socketRef = useRef(null);
  const messageCounterRef = useRef(0);

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
    s.on("conversationRead", ({ conversationId: cid }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.conversationId === cid && m.senderId !== user?.id ? { ...m, read: true } : m,
        ),
      );
    });

    function onMessage(msg) {
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
      if (secret) {
        const encrypted = await encryptMessage(secret, plaintext, conversationId, counter);
        response = await api("/messages", {
          method: "POST",
          body: JSON.stringify({
            conversationId,
            encryptedPayload: encrypted.encryptedPayload,
            iv: encrypted.iv,
            authTag: encrypted.authTag,
            metadata: { counter },
          }),
          token,
        });
      } else {
        response = await api("/messages", {
          method: "POST",
          body: JSON.stringify({ conversationId, body: plaintext }),
          token,
        });
      }
      setMessages((prev) => {
        const newMsg = { ...response.message, body: plaintext };
        return prev.some((m) => m._id === response.message._id)
          ? prev.map((m) => (m._id === response.message._id ? newMsg : m))
          : [...prev, newMsg];
      });
      setBody("");
    } catch (err) {
      toast.error(err.message);
    }
  }

  const handleDecryptMessage = useCallback(
    async (message) => {
      if (!e2eeReady) return "...";
      if (!message.encryptedPayload) return message.body || "";

      if (!message.iv || !message.authTag) {
        console.warn("missing iv or authTag for encrypted message", {
          iv: message.iv,
          authTag: message.authTag,
          hasPayload: !!message.encryptedPayload,
          msgId: message._id,
        });
        return "⚠️ Decryption failed";
      }

      const counter = message.metadata?.counter ?? 0;

      let peerId = message.senderId;
      if (message.senderId === user?.id) {
        const peer = otherParticipant(activeConversation);
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
        console.error("decrypt error:", err, {
          iv: message.iv,
          authTag: message.authTag,
          hasPayload: !!message.encryptedPayload,
          counter,
          senderId: message.senderId,
          convId: message.conversationId,
          msgId: message._id,
        });
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
      let encryptedFile = null;
      if (secret) {
        encryptedFile = await encryptFile(secret, file, conversationId, counter);
      }

      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      const attachment = {
        type: type === "image" ? "image" : "file",
        url: uploadData.file.url,
        name: uploadData.file.name,
        size: uploadData.file.size,
        encryptedPayload: encryptedFile?.encryptedPayload || null,
        fileIv: encryptedFile?.iv || null,
        fileAuthTag: encryptedFile?.authTag || null,
      };

      const response = await api("/messages", {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          attachments: [attachment],
          metadata: secret ? { counter } : {},
          ...(secret ? { encryptedPayload: "_", iv: "_", authTag: "_" } : {}),
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

  return (
    <div className="flex h-full w-full">
      {showSearch ? (
        <div className="flex w-full flex-col border-r border-border md:w-80">
          <AddFriend
            show={showSearch}
            onToggle={() => setShowSearch(false)}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            searchResults={searchResults}
            onStartConversation={startConversation}
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
          />
          <ConversationList
            conversations={conversations}
            activeId={conversationId}
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
            />
            <MessageList
              messages={messages}
              currentUserId={user?.id}
              decryptMessage={handleDecryptMessage}
            />
            <MessageInput
              value={body}
              onChange={setBody}
              onSend={handleSend}
              onUploadImage={(file) => handleUploadFile(file, "image")}
              onUploadFile={(file) => handleUploadFile(file, "file")}
              disabled={!e2eeReady}
            />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center max-md:hidden">
            <MessageCircle className="mb-4 size-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
