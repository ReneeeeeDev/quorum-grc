"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [loading, pathname, router, user]);

  if (pathname === "/login") return <>{children}</>;

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Loading portal...</div>;
  }

  if (!user) return null;

  return <>{children}</>;
}

