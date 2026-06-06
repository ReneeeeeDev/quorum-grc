export type Role = "Admin" | "Governance Officer" | "Manager" | "Auditor" | "Board Member";

export type PolicyStatus = "draft" | "review" | "approval" | "published" | "archived";
export type ActionStatus = "open" | "in_progress" | "complete" | "overdue";

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  department_id: number | null;
};

export type Department = {
  id: number;
  name: string;
  head_id: number | null;
  created_at: string;
};

export type Policy = {
  id: number;
  title: string;
  version: string;
  status: PolicyStatus;
  owner_id: number;
  effective_date: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

export type Meeting = {
  id: number;
  title: string;
  meeting_date: string;
  committee_id: number | null;
  agenda: string | null;
  minutes: string | null;
  created_at: string;
};

export type Decision = {
  id: number;
  meeting_id: number | null;
  description: string;
  decision_date: string;
  owner_id: number | null;
  created_at: string;
};

export type ActionItem = {
  id: number;
  decision_id: number | null;
  title: string;
  assigned_to: number;
  due_date: string;
  status: ActionStatus;
  created_at: string;
};

export type AuditLog = {
  id: number;
  actor_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: string | null;
  created_at: string;
};

export type ReportSummary = {
  open_actions: number;
  overdue_items: number;
  published_policies: number;
  pending_approvals: number;
  upcoming_meetings: number;
};

