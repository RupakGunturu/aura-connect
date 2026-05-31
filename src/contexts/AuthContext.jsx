import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { API_URL, setRefreshHandler } from "@/lib/api";

const STORAGE_KEY = "vault.session";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setToken(parsed.token);
        setRefreshToken(parsed.refreshToken);
        setUser(parsed.user);
      }
    } catch {
      // ignore malformed storage
    }
    setReady(true);
  }, []);

  const save = useCallback((t, rt, u) => {
    setToken(t);
    setRefreshToken(rt);
    setUser(u);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, refreshToken: rt, user: u }));
    }
  }, []);

  const setSession = useCallback((accessToken, refreshTk, nextUser) => {
    save(accessToken, refreshTk, nextUser);
  }, [save]);

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      save(token, refreshToken, next);
      return next;
    });
  }, [token, refreshToken, save]);

  const refreshAuth = useCallback(async () => {
    if (!refreshToken) throw new Error("No refresh token");
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const msg = (data && (data.error || data.message)) || "Refresh failed";
      throw new Error(msg);
    }
    save(data.tokens.accessToken, data.tokens.refreshToken, data.user ?? user);
    return data.tokens.accessToken;
  }, [refreshToken, user, save]);

  useEffect(() => {
    setRefreshHandler(refreshAuth);
  }, [refreshAuth]);

  const logout = useCallback(() => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const value = useMemo(
    () => ({ user, token, refreshToken, ready, setSession, updateUser, refreshAuth, logout }),
    [user, token, refreshToken, ready, setSession, updateUser, refreshAuth, logout],
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
