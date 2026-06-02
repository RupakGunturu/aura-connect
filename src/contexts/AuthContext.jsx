import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { API_URL, setRefreshHandler, setOnRefreshFail } from "@/lib/api";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { showNotification, playMessageSound, playFriendRequestSound } from "@/lib/notifications";

const SESSION_FLAG = "session_active";

let unreadBadge = 0;

function updateBadge() {
  if (navigator.setAppBadge) {
    navigator.setAppBadge(unreadBadge).catch(() => {});
  }
}

export function clearUnreadBadge() {
  unreadBadge = 0;
  if (navigator.clearAppBadge) {
    navigator.clearAppBadge().catch(() => {});
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [friendRequestCount, setFriendRequestCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(SESSION_FLAG)) {
      setReady(true);
      return;
    }
    sessionStorage.setItem("redirect_after_login", window.location.pathname);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (res) => {
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (res.ok && data) {
          sessionStorage.removeItem("redirect_after_login");
          setToken(data.accessToken);
          setUser(data.user);
        } else {
          localStorage.removeItem(SESSION_FLAG);
        }
      })
      .catch(() => {
        localStorage.removeItem(SESSION_FLAG);
      })
      .finally(() => {
        clearTimeout(timeout);
        setReady(true);
      });
  }, []);

  const save = useCallback((t, u) => {
    setToken(t);
    setUser(u);
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_FLAG, "true");
    }
  }, []);

  const setSession = useCallback(
    (accessToken, nextUser) => {
      save(accessToken, nextUser);
    },
    [save],
  );

  const updateUser = useCallback(
    (patch) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        save(token, next);
        return next;
      });
    },
    [token, save],
  );

  const refreshAuth = useCallback(async () => {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const msg = (data && (data.error || data.message)) || "Refresh failed";
      throw new Error(msg);
    }
    save(data.accessToken, data.user);
    return data.accessToken;
  }, [save]);

  useEffect(() => {
    setRefreshHandler(refreshAuth);
  }, [refreshAuth]);

  useEffect(() => {
    if (!token || !user?.id) return;
    const s = getSocket(token);

    const onFriendRequest = () => {
      setFriendRequestCount((c) => c + 1);
      unreadBadge++;
      updateBadge();
      playFriendRequestSound();
      showNotification("Friend Request", { body: "Someone sent you a friend request", tag: "friend-request", renotify: true });
    };

    const onMessage = (msg) => {
      if (msg.senderId === user.id) return;
      const viewing = window.location.pathname.startsWith(`/chat/${msg.conversationId}`);
      if (!viewing) {
        unreadBadge++;
        updateBadge();
        playMessageSound();
        showNotification("New message", {
          body: msg.body || "Encrypted message",
          tag: `msg-${msg.conversationId}`,
          renotify: true,
          onClick: () => {
            window.location.href = `/chat/${msg.conversationId}`;
          },
        });
      }
    };

    s.on("friendRequestReceived", onFriendRequest);
    s.on("message", onMessage);

    return () => {
      s.off("friendRequestReceived", onFriendRequest);
      s.off("message", onMessage);
    };
  }, [token, user?.id]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
    } catch {
      // ignore server error on logout
    }
    disconnectSocket();
    setToken(null);
    setUser(null);
    setFriendRequestCount(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_FLAG);
    }
  }, [token]);

  useEffect(() => {
    setOnRefreshFail(logout);
  }, [logout]);

  const value = useMemo(
    () => ({ user, token, ready, setSession, updateUser, refreshAuth, logout, friendRequestCount, clearUnreadBadge }),
    [user, token, ready, setSession, updateUser, refreshAuth, logout, friendRequestCount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
