"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { ApiError, apiRequest, getToken, setToken } from "@/lib/api";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const nextUser = await apiRequest<User>("/api/auth/me");
      setUser(nextUser);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    function handleUnauthorized() {
      setToken(null);
      setUser(null);
      router.replace("/login");
    }

    window.addEventListener("gmp:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("gmp:unauthorized", handleUnauthorized);
  }, [router]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiRequest<{ access_token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(response.access_token);
      await refreshUser();
      router.push("/dashboard");
    },
    [refreshUser, router],
  );

  const logout = useCallback(() => {
    if (getToken()) {
      void apiRequest("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    }
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(() => ({ user, loading, login, logout, refreshUser }), [user, loading, login, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
