export type Role = "Admin" | "Governance Officer" | "Manager" | "Auditor" | "Board Member";

export type PolicyStatus = "draft" | "review" | "approval" | "published" | "archived";
export type ActionStatus = "open" | "in_progress" | "complete" | "overdue";
export type NotificationStatus = "unread" | "read";
export type CalendarEventType = "meeting" | "review" | "audit" | "renewal";
export type WorkflowStepStatus = "pending" | "approved" | "rejected";
export type IntegrationStatus = "configured" | "disabled";
export type SSOProviderStatus = "enabled" | "disabled";

export type User = {
  id: number;
  tenant_id: number | null;
  name: string;
  email: string;
  role: Role;
  department_id: number | null;
};

export type Department = {
  id: number;
  tenant_id: number | null;
  name: string;
  head_id: number | null;
  created_at: string;
};

export type Policy = {
  id: number;
  tenant_id: number | null;
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
  tenant_id: number | null;
  title: string;
  meeting_date: string;
  committee_id: number | null;
  agenda: string | null;
  minutes: string | null;
  created_at: string;
};

export type Decision = {
  id: number;
  tenant_id: number | null;
  meeting_id: number | null;
  description: string;
  decision_date: string;
  owner_id: number | null;
  created_at: string;
};

export type ActionItem = {
  id: number;
  tenant_id: number | null;
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
  unread_notifications: number;
  documents: number;
  active_integrations: number;
};

export type Tenant = {
  id: number;
  name: string;
  domain: string | null;
  is_active: boolean;
  created_at: string;
};

export type DocumentRecord = {
  id: number;
  tenant_id: number | null;
  title: string;
  filename: string;
  content_type: string;
  file_size: number;
  storage_path: string;
  linked_entity_type: string | null;
  linked_entity_id: number | null;
  uploaded_by: number | null;
  created_at: string;
};

export type NotificationRecord = {
  id: number;
  tenant_id: number | null;
  user_id: number | null;
  title: string;
  message: string;
  status: NotificationStatus;
  due_date: string | null;
  created_at: string;
};

export type CalendarEvent = {
  id: number;
  tenant_id: number | null;
  title: string;
  event_type: CalendarEventType;
  event_date: string;
  owner_id: number | null;
  description: string | null;
  created_at: string;
};

export type WorkflowStep = {
  id: number;
  tenant_id: number | null;
  policy_id: number;
  step_name: string;
  approver_id: number;
  sequence: number;
  status: WorkflowStepStatus;
  comments: string | null;
  created_at: string;
};

export type IntegrationConnection = {
  id: number;
  tenant_id: number | null;
  name: string;
  integration_type: string;
  endpoint_url: string | null;
  status: IntegrationStatus;
  created_at: string;
};

export type SSOProvider = {
  id: number;
  tenant_id: number | null;
  name: string;
  provider_type: string;
  metadata_url: string | null;
  status: SSOProviderStatus;
  created_at: string;
};
