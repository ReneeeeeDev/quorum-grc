import type { ActionStatus, ComplianceStatus, IntegrationStatus, NotificationStatus, PolicyStatus, RiskSeverity, RiskStatus, SSOProviderStatus, WorkflowStepStatus } from "@/lib/types";

const styles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  review: "bg-blue-100 text-blue-700",
  approval: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-700",
  archived: "bg-zinc-100 text-zinc-700",
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-800",
  complete: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
  unread: "bg-blue-100 text-blue-700",
  read: "bg-zinc-100 text-zinc-700",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  configured: "bg-emerald-100 text-emerald-700",
  disabled: "bg-zinc-100 text-zinc-700",
  enabled: "bg-emerald-100 text-emerald-700",
  not_started: "bg-zinc-100 text-zinc-700",
  compliant: "bg-emerald-100 text-emerald-700",
  non_compliant: "bg-red-100 text-red-700",
  mitigating: "bg-amber-100 text-amber-800",
  closed: "bg-emerald-100 text-emerald-700",
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-800",
  critical: "bg-red-100 text-red-700",
};

export function StatusChip({ status }: { status: PolicyStatus | ActionStatus | NotificationStatus | WorkflowStepStatus | IntegrationStatus | SSOProviderStatus | ComplianceStatus | RiskStatus | RiskSeverity }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-semibold capitalize ${styles[status] ?? styles.draft}`}>
      {status.replace("_", " ")}
    </span>
  );
}
