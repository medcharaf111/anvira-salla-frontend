"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import {
  api,
  getStoredAuth,
  setAuthIds,
  setStoredMerchantId,
  type MerchantSummary,
  type User,
} from "./api";

interface AuthState {
  merchantId: string | null;
  merchant: MerchantSummary | null;
  merchants: MerchantSummary[];
  users: User[];
  currentUser: User | null;
  setCurrentUser: (u: User) => void;
  switchMerchant: (id: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<MerchantSummary | null>(null);
  const [merchants, setMerchants] = useState<MerchantSummary[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrent] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const applyBootstrap = useCallback((me: Awaited<ReturnType<typeof api.bootstrap>>) => {
    setMerchantId(me.merchantId);
    setMerchant(me.merchant ?? null);
    setMerchants(me.merchants ?? []);
    setUsers(me.users);
    // Always sync localStorage merchantId so subsequent API calls hit the
    // right merchant — even if no current user resolves yet.
    setStoredMerchantId(me.merchantId);
    const stored = getStoredAuth();
    const initial =
      me.users.find((u) => u.id === stored.userId && u.id /* same merchant context */) ??
      me.users.find((u) => u.role === "owner") ??
      me.users[0] ??
      null;
    if (initial) {
      setCurrent(initial);
      setAuthIds(me.merchantId, initial.id);
    } else {
      setCurrent(null);
      setAuthIds(me.merchantId, null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // If user previously selected a specific merchant, honor it
        const stored = getStoredAuth();
        const me = await api.bootstrap(stored.merchantId ?? undefined);
        if (cancelled) return;
        applyBootstrap(me);
      } catch (err) {
        console.error("auth bootstrap failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyBootstrap]);

  const setCurrentUser = (u: User) => {
    setCurrent(u);
    if (merchantId) setAuthIds(merchantId, u.id);
  };

  const switchMerchant = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const me = await api.bootstrap(id);
        applyBootstrap(me);
      } finally {
        setLoading(false);
      }
    },
    [applyBootstrap]
  );

  return (
    <AuthContext.Provider
      value={{
        merchantId,
        merchant,
        merchants,
        users,
        currentUser,
        setCurrentUser,
        switchMerchant,
        loading,
      }}
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
