import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { API_URL, setRefreshHandler, setOnRefreshFail } from "@/lib/api";
import { disconnectSocket } from "@/lib/socket";

const SESSION_FLAG = "session_active";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(SESSION_FLAG)) {
      setReady(true);
      return;
    }
    fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then(async (res) => {
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (res.ok && data) {
          setToken(data.accessToken);
          setUser(data.user);
        } else {
          localStorage.removeItem(SESSION_FLAG);
        }
      })
      .catch(() => {
        localStorage.removeItem(SESSION_FLAG);
      })
      .finally(() => setReady(true));
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
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_FLAG);
    }
  }, [token]);

  useEffect(() => {
    setOnRefreshFail(logout);
  }, [logout]);

  const value = useMemo(
    () => ({ user, token, ready, setSession, updateUser, refreshAuth, logout }),
    [user, token, ready, setSession, updateUser, refreshAuth, logout],
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
