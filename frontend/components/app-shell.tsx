"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Gavel,
  GitPullRequest,
  Landmark,
  LayoutDashboard,
  LogOut,
  Network,
  Paperclip,
  Plug,
  KeyRound,
  Radar,
  ScrollText,
  Settings,
  Users,
  Bell,
  Menu,
  X,
} from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/lib/auth";
import { useI18n, type Translate } from "@/lib/i18n";
import type { Role } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["Admin", "Governance Officer", "Manager", "Auditor", "Board Member"] },
  { href: "/policies", label: "Policies", icon: FileText, roles: ["Admin", "Governance Officer", "Manager", "Auditor", "Board Member"] },
  { href: "/departments", label: "Committees", icon: Users, roles: ["Admin", "Governance Officer", "Manager", "Auditor", "Board Member"] },
  { href: "/meetings", label: "Meetings", icon: CalendarDays, roles: ["Admin", "Governance Officer", "Manager", "Auditor", "Board Member"] },
  { href: "/decisions", label: "Decisions", icon: Gavel, roles: ["Admin", "Governance Officer", "Manager", "Auditor", "Board Member"] },
  { href: "/actions", label: "Actions", icon: ClipboardCheck, roles: ["Admin", "Governance Officer", "Manager"] },
  { href: "/documents", label: "Documents", icon: Paperclip, roles: ["Admin", "Governance Officer", "Manager", "Auditor", "Board Member"] },
  { href: "/notifications", label: "Notifications", icon: Bell, roles: ["Admin", "Governance Officer", "Manager", "Auditor", "Board Member"] },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, roles: ["Admin", "Governance Officer", "Manager", "Auditor", "Board Member"] },
  { href: "/workflows", label: "Workflows", icon: GitPullRequest, roles: ["Admin", "Governance Officer", "Manager"] },
  { href: "/compliance", label: "Compliance", icon: Landmark, roles: ["Admin", "Governance Officer", "Manager", "Auditor"] },
  { href: "/risks", label: "Risks", icon: Radar, roles: ["Admin", "Governance Officer", "Manager", "Auditor"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["Admin", "Governance Officer", "Manager", "Auditor", "Board Member"] },
  { href: "/audit-logs", label: "Audit Logs", icon: ScrollText, roles: ["Admin", "Governance Officer", "Auditor"] },
  { href: "/tenants", label: "Tenants", icon: Network, roles: ["Admin"] },
  { href: "/integrations", label: "Integrations", icon: Plug, roles: ["Admin"] },
  { href: "/sso", label: "SSO", icon: KeyRound, roles: ["Admin"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["Admin"] },
];

function visibleNavItems(role: Role | undefined) {
  if (!role) return navItems;
  return navItems.filter((item) => item.roles.includes(role));
}

export function Brand({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-base font-bold leading-none text-white shadow-sm">Q</div>
      <div>
        <div className={`text-sm font-semibold ${tone === "dark" ? "text-white" : "text-ink"}`}>Quorum</div>
        <div className={`text-xs ${tone === "dark" ? "text-white/60" : "text-muted"}`}>{t("Enterprise GRC")}</div>
      </div>
    </div>
  );
}

function NavLinks({ pathname, role, t, onNavigate }: { pathname: string; role: Role | undefined; t: Translate; onNavigate?: () => void }) {
  return (
    <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
      {visibleNavItems(role).map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
              active ? "bg-primary-soft font-semibold text-primary" : "text-muted hover:bg-canvas hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
            {t(item.label)}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-panel lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-line px-5">
          <Brand />
        </div>
        <NavLinks pathname={pathname} role={user?.role} t={t} />
        <div className="border-t border-line px-5 py-3 text-[11px] text-muted">{t("Demo environment · seeded data")}</div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-panel/90 px-4 backdrop-blur lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-muted hover:bg-canvas lg:hidden"
              aria-label={t("Open navigation")}
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-ink">Quorum GRC</div>
              <div className="hidden truncate text-xs text-muted sm:block">{t("Policies, decisions, accountability, and audit readiness")}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-ink">{user?.name}</div>
              <div className="text-xs text-muted">{user?.role ? t(user.role) : null}</div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:bg-canvas"
              aria-label={t("Log out")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        {mobileOpen ? (
          <div className="fixed inset-0 z-30 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-ink/40"
              aria-label={t("Close navigation")}
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-panel shadow-xl">
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
                <Brand />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:bg-canvas"
                  aria-label={t("Close navigation")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <NavLinks pathname={pathname} role={user?.role} t={t} onNavigate={() => setMobileOpen(false)} />
              <div className="border-t border-line px-5 py-3">
                <LanguageSwitcher />
              </div>
            </aside>
          </div>
        ) : null}
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
