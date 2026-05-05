"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, getStoredAuth, setAuthIds, type User } from "./api";

interface AuthState {
  merchantId: string | null;
  users: User[];
  currentUser: User | null;
  setCurrentUser: (u: User) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrent] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.bootstrap();
        if (cancelled) return;
        setMerchantId(me.merchantId);
        setUsers(me.users);
        const stored = getStoredAuth();
        const initial =
          me.users.find((u) => u.id === stored.userId) ??
          me.users.find((u) => u.role === "owner") ??
          me.users[0] ??
          null;
        if (initial) {
          setCurrent(initial);
          setAuthIds(me.merchantId, initial.id);
        }
      } catch (err) {
        console.error("auth bootstrap failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrentUser = (u: User) => {
    setCurrent(u);
    if (merchantId) setAuthIds(merchantId, u.id);
  };

  return (
    <AuthContext.Provider
      value={{ merchantId, users, currentUser, setCurrentUser, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
