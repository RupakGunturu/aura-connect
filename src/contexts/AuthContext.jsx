import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { API_URL, setRefreshHandler } from "@/lib/api";

const STORAGE_KEY = "vault.session";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setToken(parsed.token);
        setUser(parsed.user);
      }
    } catch {
      // ignore malformed storage
    }
    setReady(true);
  }, []);

  const save = useCallback((t, u) => {
    setToken(t);
    setUser(u);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token: t, user: u }),
      );
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
    save(data.accessToken, data.user ?? user);
    return data.accessToken;
  }, [user, save]);

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
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [token]);

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
