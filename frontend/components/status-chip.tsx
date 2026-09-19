"use client";

import { statusLabel, useI18n } from "@/lib/i18n";
import type { ActionStatus, ComplianceStatus, IntegrationStatus, NotificationStatus, PolicyStatus, RiskSeverity, RiskStatus, SSOProviderStatus, WorkflowStepStatus } from "@/lib/types";

const styles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  review: "bg-sky-100 text-sky-800",
  approval: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-800",
  archived: "bg-zinc-100 text-zinc-700",
  open: "bg-sky-100 text-sky-800",
  in_progress: "bg-amber-100 text-amber-800",
  complete: "bg-emerald-100 text-emerald-800",
  overdue: "bg-red-100 text-red-700",
  unread: "bg-sky-100 text-sky-800",
  read: "bg-zinc-100 text-zinc-700",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  configured: "bg-emerald-100 text-emerald-800",
  disabled: "bg-zinc-100 text-zinc-700",
  enabled: "bg-emerald-100 text-emerald-800",
  not_started: "bg-zinc-100 text-zinc-700",
  compliant: "bg-emerald-100 text-emerald-800",
  non_compliant: "bg-red-100 text-red-700",
  mitigating: "bg-amber-100 text-amber-800",
  closed: "bg-emerald-100 text-emerald-800",
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-sky-100 text-sky-800",
  high: "bg-amber-100 text-amber-800",
  critical: "bg-red-100 text-red-700",
};

export function StatusChip({ status }: { status: PolicyStatus | ActionStatus | NotificationStatus | WorkflowStepStatus | IntegrationStatus | SSOProviderStatus | ComplianceStatus | RiskStatus | RiskSeverity }) {
  const { t } = useI18n();
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] ?? styles.draft}`}>
      {statusLabel(t, status)}
    </span>
  );
}
