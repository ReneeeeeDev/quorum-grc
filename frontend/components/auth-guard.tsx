"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const hasStoredToken = Boolean(getToken());

  useEffect(() => {
    if (!loading && !user && !hasStoredToken && pathname !== "/login") {
      router.push("/login");
    }
  }, [hasStoredToken, loading, pathname, router, user]);

  if (pathname === "/login") return <>{children}</>;

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted">{t("Loading portal...")}</div>;
  }

  if (!user && !hasStoredToken) return null;

  return <>{children}</>;
}
