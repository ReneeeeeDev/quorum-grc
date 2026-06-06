import type { ActionStatus, PolicyStatus } from "@/lib/types";

const styles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  review: "bg-blue-100 text-blue-700",
  approval: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-700",
  archived: "bg-zinc-100 text-zinc-700",
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-800",
  complete: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700"
};

export function StatusChip({ status }: { status: PolicyStatus | ActionStatus }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-semibold capitalize ${styles[status] ?? styles.draft}`}>
      {status.replace("_", " ")}
    </span>
  );
}

