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
  ShieldCheck,
  Users,
  Bell,
  Menu,
  X,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigation = visibleNavItems(user?.role);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-ink text-white lg:flex">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Governance Portal</div>
            <div className="text-xs text-white/60">Enterprise GRC</div>
          </div>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded px-3 py-2 text-sm transition ${
                  active ? "bg-white text-ink" : "text-white/72 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-panel px-4 shadow-sm lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-line text-muted hover:bg-slate-50 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
            <div className="text-sm font-semibold text-ink">Governance Management Portal</div>
            <div className="text-xs text-muted">Policies, decisions, accountability, and audit readiness</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-ink">{user?.name}</div>
              <div className="text-xs text-muted">{user?.role}</div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-9 w-9 items-center justify-center rounded border border-line text-muted hover:bg-slate-50"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        {mobileOpen ? (
          <div className="fixed inset-0 z-30 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-ink/50"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-ink text-white shadow-xl">
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded bg-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Governance Portal</div>
                    <div className="text-xs text-white/60">Enterprise GRC</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/10 text-white/70 hover:bg-white/10"
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded px-3 py-2 text-sm transition ${
                        active ? "bg-white text-ink" : "text-white/72 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        ) : null}
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
