"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, Clock, FileCheck2, ListChecks, Paperclip, Plug } from "lucide-react";

import { StatusChip } from "@/components/status-chip";
import { apiRequest, apiUpload, getToken } from "@/lib/api";
import type {
  ActionItem,
  AuditLog,
  CalendarEvent,
  ComplianceObligation,
  Decision,
  Department,
  DocumentRecord,
  IntegrationConnection,
  Meeting,
  NotificationRecord,
  Policy,
  ReportBreakdown,
  ReportBreakdownItem,
  ReportSummary,
  Risk,
  SSOProvider,
  Tenant,
  User,
  WorkflowStep,
} from "@/lib/types";

type Field = {
  name: string;
  label: string;
  type?: "text" | "date" | "email" | "password" | "select" | "textarea";
  options?: { label: string; value: string }[];
  required?: boolean;
};

type LoadState = "idle" | "loading" | "ready" | "error";

const emptyReportSummary: ReportSummary = {
  open_actions: 0,
  overdue_items: 0,
  published_policies: 0,
  pending_approvals: 0,
  upcoming_meetings: 0,
  unread_notifications: 0,
  documents: 0,
  active_integrations: 0,
};

const emptyReportBreakdown: ReportBreakdown = {
  policy_status: [],
  action_status: [],
  risk_severity: [],
  compliance_status: [],
  upcoming_meetings_by_month: [],
};

const policyStatusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Review", value: "review" },
  { label: "Approval", value: "approval" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

const actionStatusOptions = [
  { label: "Open", value: "open" },
  { label: "In progress", value: "in_progress" },
  { label: "Complete", value: "complete" },
  { label: "Overdue", value: "overdue" },
];

const roleOptions = [
  { label: "Admin", value: "Admin" },
  { label: "Governance Officer", value: "Governance Officer" },
  { label: "Manager", value: "Manager" },
  { label: "Auditor", value: "Auditor" },
  { label: "Board Member", value: "Board Member" },
];

const eventTypeOptions = [
  { label: "Meeting", value: "meeting" },
  { label: "Review", value: "review" },
  { label: "Audit", value: "audit" },
  { label: "Renewal", value: "renewal" },
];

const workflowStatusOptions = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const integrationStatusOptions = [
  { label: "Configured", value: "configured" },
  { label: "Disabled", value: "disabled" },
];

const ssoStatusOptions = [
  { label: "Enabled", value: "enabled" },
  { label: "Disabled", value: "disabled" },
];

const complianceStatusOptions = [
  { label: "Not started", value: "not_started" },
  { label: "In progress", value: "in_progress" },
  { label: "Compliant", value: "compliant" },
  { label: "Non compliant", value: "non_compliant" },
];

const riskStatusOptions = [
  { label: "Open", value: "open" },
  { label: "Mitigating", value: "mitigating" },
  { label: "Closed", value: "closed" },
];

const riskSeverityOptions = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Critical", value: "critical" },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nextMonth() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded border border-line bg-panel shadow-panel">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function MiniBarChart({ rows }: { rows: ReportBreakdownItem[] }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <div className="space-y-3">
      {rows.length ? rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[120px_1fr_36px] items-center gap-3 text-xs">
          <span className="truncate font-semibold capitalize text-ink">{row.label.replaceAll("_", " ")}</span>
          <div className="h-2 overflow-hidden rounded bg-slate-100">
            <div className="h-full rounded bg-primary" style={{ width: `${Math.max(6, (row.value / max) * 100)}%` }} />
          </div>
          <span className="text-right font-semibold text-muted">{row.value}</span>
        </div>
      )) : (
        <div className="rounded border border-dashed border-line px-3 py-6 text-center text-sm text-muted">No chart data available.</div>
      )}
    </div>
  );
}

function DataTable<T>({
  rows,
  columns,
  empty,
}: {
  rows: T[];
  columns: { header: string; cell: (row: T) => React.ReactNode }[];
  empty: string;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRows = normalizedQuery
    ? rows.filter((row) => JSON.stringify(row).toLowerCase().includes(normalizedQuery))
    : rows;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, rows.length]);

  if (!rows.length) {
    return <div className="rounded border border-dashed border-line px-4 py-8 text-center text-sm text-muted">{empty}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search records"
          className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-primary sm:max-w-xs"
        />
        <div className="text-xs text-muted">
          Showing {visibleRows.length} of {filteredRows.length} records
        </div>
      </div>
      {!filteredRows.length ? (
        <div className="rounded border border-dashed border-line px-4 py-8 text-center text-sm text-muted">No records match your search.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-slate-50 text-xs uppercase text-muted">
                {columns.map((column) => (
                  <th key={column.header} className="px-3 py-2 font-semibold">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, index) => (
                <tr key={`${currentPage}-${index}`} className="border-b border-line last:border-0">
                  {columns.map((column) => (
                    <td key={column.header} className="px-3 py-3 align-top text-ink">
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={currentPage === 1}
            className="rounded border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-muted">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={currentPage === totalPages}
            className="rounded border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CompactForm({
  title,
  fields,
  initialValues,
  onSubmit,
}: {
  title: string;
  fields: Field[];
  initialValues: Record<string, string>;
  onSubmit: (values: Record<string, string>) => Promise<void>;
}) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(values);
      setValues(initialValues);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Panel title={title}>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className={field.type === "textarea" ? "block md:col-span-2" : "block"}>
            <span className="text-xs font-semibold uppercase text-muted">{field.label}</span>
            {field.type === "textarea" ? (
              <textarea
                value={values[field.name] ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                className="mt-1 min-h-24 w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-primary"
                required={field.required}
              />
            ) : field.type === "select" ? (
              <select
                value={values[field.name] ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                className="mt-1 w-full rounded border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                required={field.required}
              >
                <option value="">Select</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={values[field.name] ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                className="mt-1 w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-primary"
                type={field.type ?? "text"}
                required={field.required}
              />
            )}
          </label>
        ))}
        {error ? <div className="rounded bg-red-50 px-3 py-2 text-sm text-danger md:col-span-2">{error}</div> : null}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Panel>
  );
}

function usePortalData() {
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [reports, setReports] = useState<ReportSummary | null>(null);
  const [reportBreakdown, setReportBreakdown] = useState<ReportBreakdown>(emptyReportBreakdown);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationConnection[]>([]);
  const [ssoProviders, setSsoProviders] = useState<SSOProvider[]>([]);
  const [complianceObligations, setComplianceObligations] = useState<ComplianceObligation[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);

  const reload = useCallback(async () => {
    setState("loading");
    setError(null);

    const requests = [
      apiRequest<User[]>("/api/users"),
      apiRequest<Department[]>("/api/departments"),
      apiRequest<Policy[]>("/api/policies"),
      apiRequest<Meeting[]>("/api/meetings"),
      apiRequest<Decision[]>("/api/decisions"),
      apiRequest<ActionItem[]>("/api/action-items"),
      apiRequest<ReportSummary>("/api/reports"),
      apiRequest<ReportBreakdown>("/api/reports/breakdown"),
      apiRequest<AuditLog[]>("/api/audit-logs"),
      apiRequest<Tenant[]>("/api/tenants"),
      apiRequest<DocumentRecord[]>("/api/documents"),
      apiRequest<NotificationRecord[]>("/api/notifications"),
      apiRequest<CalendarEvent[]>("/api/calendar-events"),
      apiRequest<WorkflowStep[]>("/api/workflow-steps"),
      apiRequest<IntegrationConnection[]>("/api/integrations"),
      apiRequest<SSOProvider[]>("/api/sso-providers"),
      apiRequest<ComplianceObligation[]>("/api/compliance-obligations"),
      apiRequest<Risk[]>("/api/risks"),
    ] as const;

    const results = await Promise.allSettled(requests);
    const failed = results.filter((result) => result.status === "rejected");

    if (failed.length === results.length) {
      const firstError = failed[0]?.reason;
      setError(firstError instanceof Error ? firstError.message : "Unable to load portal data");
      setState("error");
      return;
    }

    const valueAt = <T,>(index: number, fallback: T): T => {
      const result = results[index];
      return result.status === "fulfilled" ? (result.value as T) : fallback;
    };

    setUsers(valueAt<User[]>(0, []));
    setDepartments(valueAt<Department[]>(1, []));
    setPolicies(valueAt<Policy[]>(2, []));
    setMeetings(valueAt<Meeting[]>(3, []));
    setDecisions(valueAt<Decision[]>(4, []));
    setActions(valueAt<ActionItem[]>(5, []));
    setReports(valueAt<ReportSummary>(6, emptyReportSummary));
    setReportBreakdown(valueAt<ReportBreakdown>(7, emptyReportBreakdown));
    setAuditLogs(valueAt<AuditLog[]>(8, []));
    setTenants(valueAt<Tenant[]>(9, []));
    setDocuments(valueAt<DocumentRecord[]>(10, []));
    setNotifications(valueAt<NotificationRecord[]>(11, []));
    setCalendarEvents(valueAt<CalendarEvent[]>(12, []));
    setWorkflowSteps(valueAt<WorkflowStep[]>(13, []));
    setIntegrations(valueAt<IntegrationConnection[]>(14, []));
    setSsoProviders(valueAt<SSOProvider[]>(15, []));
    setComplianceObligations(valueAt<ComplianceObligation[]>(16, []));
    setRisks(valueAt<Risk[]>(17, []));
    setState("ready");
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    state,
    error,
    users,
    departments,
    policies,
    meetings,
    decisions,
    actions,
    reports,
    reportBreakdown,
    auditLogs,
    tenants,
    documents,
    notifications,
    calendarEvents,
    workflowSteps,
    integrations,
    ssoProviders,
    complianceObligations,
    risks,
    reload,
  };
}

function LoadingOrError({ state, error }: { state: LoadState; error: string | null }) {
  if (state === "loading" || state === "idle") {
    return <div className="rounded border border-line bg-panel px-4 py-8 text-center text-sm text-muted">Loading governance records...</div>;
  }
  if (state === "error") {
    return <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">{error}</div>;
  }
  return null;
}

function userOptions(users: User[]) {
  return users.map((user) => ({ label: `${user.name} (${user.role})`, value: String(user.id) }));
}

function departmentOptions(departments: Department[]) {
  return departments.map((department) => ({ label: department.name, value: String(department.id) }));
}

function meetingOptions(meetings: Meeting[]) {
  return meetings.map((meeting) => ({ label: meeting.title, value: String(meeting.id) }));
}

function decisionOptions(decisions: Decision[]) {
  return decisions.map((decision) => ({ label: `Decision #${decision.id}`, value: String(decision.id) }));
}

function tenantOptions(tenants: Tenant[]) {
  return tenants.map((tenant) => ({ label: tenant.name, value: String(tenant.id) }));
}

function policyOptions(policies: Policy[]) {
  return policies.map((policy) => ({ label: policy.title, value: String(policy.id) }));
}

async function downloadApiFile(path: string, filename: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  const response = await fetch(`${apiUrl}${path}`, {
    headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
  });
  if (!response.ok) throw new Error("Download failed");
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

export function DashboardScreen() {
  const data = usePortalData();

  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  const cards = [
    { label: "Open actions", value: data.reports?.open_actions ?? 0, icon: ListChecks },
    { label: "Overdue items", value: data.reports?.overdue_items ?? 0, icon: AlertTriangle },
    { label: "Published policies", value: data.reports?.published_policies ?? 0, icon: FileCheck2 },
    { label: "Pending approvals", value: data.reports?.pending_approvals ?? 0, icon: Clock },
    { label: "Upcoming meetings", value: data.reports?.upcoming_meetings ?? 0, icon: CheckCircle2 },
    { label: "Documents", value: data.reports?.documents ?? 0, icon: Paperclip },
    { label: "Unread alerts", value: data.reports?.unread_notifications ?? 0, icon: Bell },
    { label: "Integrations", value: data.reports?.active_integrations ?? 0, icon: Plug },
  ];

  return (
    <>
      <PageHeader title="Executive Dashboard" description="Governance KPIs, pending accountability items, and recent enterprise activity." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded border border-line bg-panel p-4 shadow-panel">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted">{card.label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-ink">{card.value}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Policy lifecycle">
          <MiniBarChart rows={data.reportBreakdown.policy_status} />
        </Panel>
        <Panel title="Action status">
          <MiniBarChart rows={data.reportBreakdown.action_status} />
        </Panel>
        <Panel title="Risk severity">
          <MiniBarChart rows={data.reportBreakdown.risk_severity} />
        </Panel>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Overdue and open action items">
          <DataTable
            rows={data.actions.slice(0, 6)}
            empty="No action items yet."
            columns={[
              { header: "Action", cell: (row) => row.title },
              { header: "Due", cell: (row) => row.due_date },
              { header: "Status", cell: (row) => <StatusChip status={row.status} /> },
            ]}
          />
        </Panel>
        <Panel title="Recent audit activity">
          <DataTable
            rows={data.auditLogs.slice(0, 6)}
            empty="No audit events yet."
            columns={[
              { header: "Action", cell: (row) => row.action },
              { header: "Entity", cell: (row) => `${row.entity_type} #${row.entity_id ?? "-"}` },
              { header: "Time", cell: (row) => new Date(row.created_at).toLocaleString() },
            ]}
          />
        </Panel>
      </div>
    </>
  );
}

export function PoliciesScreen() {
  const data = usePortalData();
  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  return (
    <>
      <PageHeader title="Policies" description="Manage governance policies, SOPs, standards, lifecycle states, and policy ownership." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Policy repository">
          <DataTable
            rows={data.policies}
            empty="No policies found."
            columns={[
              { header: "Title", cell: (row) => <div><div className="font-semibold">{row.title}</div><div className="text-xs text-muted">{row.summary}</div></div> },
              { header: "Version", cell: (row) => row.version },
              { header: "Status", cell: (row) => <StatusChip status={row.status} /> },
              { header: "Effective", cell: (row) => row.effective_date ?? "Not set" },
              {
                header: "Actions",
                cell: (row) => (
                  <button
                    className="text-xs font-semibold text-danger"
                    onClick={async () => {
                      await apiRequest<void>(`/api/policies/${row.id}`, { method: "DELETE" });
                      await data.reload();
                    }}
                  >
                    Delete
                  </button>
                ),
              },
            ]}
          />
        </Panel>
        <CompactForm
          title="Create policy"
          initialValues={{ title: "", version: "1.0", status: "draft", owner_id: String(data.users[0]?.id ?? ""), effective_date: today(), summary: "" }}
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "version", label: "Version", required: true },
            { name: "status", label: "Status", type: "select", options: policyStatusOptions, required: true },
            { name: "owner_id", label: "Owner", type: "select", options: userOptions(data.users), required: true },
            { name: "effective_date", label: "Effective date", type: "date" },
            { name: "summary", label: "Summary", type: "textarea" },
          ]}
          onSubmit={async (values) => {
            await apiRequest<Policy>("/api/policies", { method: "POST", body: JSON.stringify({ ...values, owner_id: Number(values.owner_id) }) });
            await data.reload();
          }}
        />
      </div>
    </>
  );
}

export function DepartmentsScreen() {
  const data = usePortalData();
  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  return (
    <>
      <PageHeader title="Committees and Departments" description="Govern governance structures, boards, committees, departments, and reporting ownership." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Governance structure">
          <DataTable
            rows={data.departments}
            empty="No departments found."
            columns={[
              { header: "Name", cell: (row) => row.name },
              { header: "Head", cell: (row) => data.users.find((user) => user.id === row.head_id)?.name ?? "Unassigned" },
              { header: "Created", cell: (row) => new Date(row.created_at).toLocaleDateString() },
            ]}
          />
        </Panel>
        <CompactForm
          title="Create department or committee"
          initialValues={{ name: "", head_id: "" }}
          fields={[
            { name: "name", label: "Name", required: true },
            { name: "head_id", label: "Head", type: "select", options: userOptions(data.users) },
          ]}
          onSubmit={async (values) => {
            await apiRequest<Department>("/api/departments", {
              method: "POST",
              body: JSON.stringify({ name: values.name, head_id: values.head_id ? Number(values.head_id) : null }),
            });
            await data.reload();
          }}
        />
      </div>
    </>
  );
}

export function MeetingsScreen() {
  const data = usePortalData();
  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  return (
    <>
      <PageHeader title="Meetings" description="Track agendas, minutes, participants, committee sessions, and follow-up governance activity." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Meeting register">
          <DataTable
            rows={data.meetings}
            empty="No meetings found."
            columns={[
              { header: "Title", cell: (row) => <div><div className="font-semibold">{row.title}</div><div className="text-xs text-muted">{row.agenda}</div></div> },
              { header: "Date", cell: (row) => row.meeting_date },
              { header: "Committee", cell: (row) => data.departments.find((department) => department.id === row.committee_id)?.name ?? "General" },
            ]}
          />
        </Panel>
        <CompactForm
          title="Schedule meeting"
          initialValues={{ title: "", meeting_date: nextMonth(), committee_id: "", agenda: "", minutes: "" }}
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "meeting_date", label: "Date", type: "date", required: true },
            { name: "committee_id", label: "Committee", type: "select", options: departmentOptions(data.departments) },
            { name: "agenda", label: "Agenda", type: "textarea" },
            { name: "minutes", label: "Minutes", type: "textarea" },
          ]}
          onSubmit={async (values) => {
            await apiRequest<Meeting>("/api/meetings", {
              method: "POST",
              body: JSON.stringify({ ...values, committee_id: values.committee_id ? Number(values.committee_id) : null }),
            });
            await data.reload();
          }}
        />
      </div>
    </>
  );
}

export function DecisionsScreen() {
  const data = usePortalData();
  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  return (
    <>
      <PageHeader title="Decision Register" description="Track board decisions, committee decisions, executive approvals, and accountability owners." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Decision register">
          <DataTable
            rows={data.decisions}
            empty="No decisions found."
            columns={[
              { header: "Decision", cell: (row) => row.description },
              { header: "Date", cell: (row) => row.decision_date },
              { header: "Meeting", cell: (row) => data.meetings.find((meeting) => meeting.id === row.meeting_id)?.title ?? "Standalone" },
              { header: "Owner", cell: (row) => data.users.find((user) => user.id === row.owner_id)?.name ?? "Unassigned" },
            ]}
          />
        </Panel>
        <CompactForm
          title="Record decision"
          initialValues={{ meeting_id: "", description: "", decision_date: today(), owner_id: "" }}
          fields={[
            { name: "meeting_id", label: "Meeting", type: "select", options: meetingOptions(data.meetings) },
            { name: "decision_date", label: "Decision date", type: "date", required: true },
            { name: "owner_id", label: "Owner", type: "select", options: userOptions(data.users) },
            { name: "description", label: "Description", type: "textarea", required: true },
          ]}
          onSubmit={async (values) => {
            await apiRequest<Decision>("/api/decisions", {
              method: "POST",
              body: JSON.stringify({
                meeting_id: values.meeting_id ? Number(values.meeting_id) : null,
                description: values.description,
                decision_date: values.decision_date,
                owner_id: values.owner_id ? Number(values.owner_id) : null,
              }),
            });
            await data.reload();
          }}
        />
      </div>
    </>
  );
}

export function ActionsScreen() {
  const data = usePortalData();
  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  return (
    <>
      <PageHeader title="Action Item Tracker" description="Monitor assigned actions, due dates, completion status, and decision follow-through." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Action items">
          <DataTable
            rows={data.actions}
            empty="No action items found."
            columns={[
              { header: "Action", cell: (row) => row.title },
              { header: "Assignee", cell: (row) => data.users.find((user) => user.id === row.assigned_to)?.name ?? "Unknown" },
              { header: "Due", cell: (row) => row.due_date },
              { header: "Status", cell: (row) => <StatusChip status={row.status} /> },
              {
                header: "Update",
                cell: (row) => (
                  <select
                    value={row.status}
                    className="rounded border border-line bg-white px-2 py-1 text-xs"
                    onChange={async (event) => {
                      await apiRequest<ActionItem>(`/api/action-items/${row.id}`, {
                        method: "PUT",
                        body: JSON.stringify({ status: event.target.value }),
                      });
                      await data.reload();
                    }}
                  >
                    {actionStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ),
              },
            ]}
          />
        </Panel>
        <CompactForm
          title="Create action item"
          initialValues={{ decision_id: "", title: "", assigned_to: String(data.users[0]?.id ?? ""), due_date: nextMonth(), status: "open" }}
          fields={[
            { name: "decision_id", label: "Decision", type: "select", options: decisionOptions(data.decisions) },
            { name: "title", label: "Title", required: true },
            { name: "assigned_to", label: "Assignee", type: "select", options: userOptions(data.users), required: true },
            { name: "due_date", label: "Due date", type: "date", required: true },
            { name: "status", label: "Status", type: "select", options: actionStatusOptions, required: true },
          ]}
          onSubmit={async (values) => {
            await apiRequest<ActionItem>("/api/action-items", {
              method: "POST",
              body: JSON.stringify({
                decision_id: values.decision_id ? Number(values.decision_id) : null,
                title: values.title,
                assigned_to: Number(values.assigned_to),
                due_date: values.due_date,
                status: values.status,
              }),
            });
            await data.reload();
          }}
        />
      </div>
    </>
  );
}

function DocumentUploadForm({ tenants, reload }: { tenants: Tenant[]; reload: () => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [linkedEntityType, setLinkedEntityType] = useState("");
  const [linkedEntityId, setLinkedEntityId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Select a file to upload");
      return;
    }
    const formData = new FormData();
    formData.set("title", title);
    if (tenantId) formData.set("tenant_id", tenantId);
    if (linkedEntityType) formData.set("linked_entity_type", linkedEntityType);
    if (linkedEntityId) formData.set("linked_entity_id", linkedEntityId);
    formData.set("file", file);
    setSubmitting(true);
    setError(null);
    try {
      await apiUpload<DocumentRecord>("/api/documents/upload", formData);
      setTitle("");
      setTenantId("");
      setLinkedEntityType("");
      setLinkedEntityId("");
      setFile(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Panel title="Upload document">
      <form onSubmit={submit} className="grid gap-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase text-muted">Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-primary" required />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-muted">Tenant</span>
          <select value={tenantId} onChange={(event) => setTenantId(event.target.value)} className="mt-1 w-full rounded border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="">None</option>
            {tenantOptions(tenants).map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase text-muted">Linked entity</span>
            <input value={linkedEntityType} onChange={(event) => setLinkedEntityType(event.target.value)} placeholder="policy" className="mt-1 w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase text-muted">Entity ID</span>
            <input value={linkedEntityId} onChange={(event) => setLinkedEntityId(event.target.value)} className="mt-1 w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
        </div>
        <input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="text-sm text-muted" required />
        {error ? <div className="rounded bg-red-50 px-3 py-2 text-sm text-danger">{error}</div> : null}
        <button type="submit" disabled={submitting} className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
          {submitting ? "Uploading..." : "Upload"}
        </button>
      </form>
    </Panel>
  );
}

export function DocumentsScreen() {
  const data = usePortalData();
  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  return (
    <>
      <PageHeader title="Document Management" description="Upload and track policies, minutes, governance reports, and supporting evidence." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Document repository">
          <DataTable
            rows={data.documents}
            empty="No documents uploaded."
            columns={[
              { header: "Title", cell: (row) => <div><div className="font-semibold">{row.title}</div><div className="text-xs text-muted">{row.filename}</div></div> },
              { header: "Size", cell: (row) => `${Math.ceil(row.file_size / 1024)} KB` },
              { header: "Linked", cell: (row) => row.linked_entity_type ? `${row.linked_entity_type} #${row.linked_entity_id ?? "-"}` : "None" },
              { header: "Uploaded", cell: (row) => new Date(row.created_at).toLocaleString() },
              {
                header: "File",
                cell: (row) => (
                  <button className="text-xs font-semibold text-primary" onClick={() => void downloadApiFile(`/api/documents/${row.id}/download`, row.filename)}>
                    Download
                  </button>
                ),
              },
            ]}
          />
        </Panel>
        <DocumentUploadForm tenants={data.tenants} reload={data.reload} />
      </div>
    </>
  );
}

export function NotificationsScreen() {
  const data = usePortalData();
  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  return (
    <>
      <PageHeader title="Notifications" description="Governance reminders, approval requests, due-date alerts, and read tracking." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Notification center">
          <DataTable
            rows={data.notifications}
            empty="No notifications found."
            columns={[
              { header: "Title", cell: (row) => <div><div className="font-semibold">{row.title}</div><div className="text-xs text-muted">{row.message}</div></div> },
              { header: "Due", cell: (row) => row.due_date ?? "None" },
              { header: "Status", cell: (row) => <StatusChip status={row.status} /> },
              {
                header: "Actions",
                cell: (row) => (
                  <div className="flex gap-3">
                    <button
                      className="text-xs font-semibold text-primary"
                      onClick={async () => {
                        await apiRequest<NotificationRecord>(`/api/notifications/${row.id}`, { method: "PUT", body: JSON.stringify({ status: "read" }) });
                        await data.reload();
                      }}
                    >
                      Mark read
                    </button>
                    <button
                      className="text-xs font-semibold text-accent"
                      onClick={async () => {
                        await apiRequest(`/api/notifications/${row.id}/dispatch`, { method: "POST" });
                        await data.reload();
                      }}
                    >
                      Dispatch
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </Panel>
        <CompactForm
          title="Create alert"
          initialValues={{ title: "", message: "", user_id: "", due_date: nextMonth() }}
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "user_id", label: "User", type: "select", options: userOptions(data.users) },
            { name: "due_date", label: "Due date", type: "date" },
            { name: "message", label: "Message", type: "textarea", required: true },
          ]}
          onSubmit={async (values) => {
            await apiRequest<NotificationRecord>("/api/notifications", {
              method: "POST",
              body: JSON.stringify({ title: values.title, message: values.message, user_id: values.user_id ? Number(values.user_id) : null, due_date: values.due_date || null }),
            });
            await data.reload();
          }}
        />
      </div>
    </>
  );
}

export function CalendarScreen() {
  const data = usePortalData();
  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  return (
    <>
      <PageHeader title="Governance Calendar" description="Track reviews, meetings, audits, renewals, and accountable owners." />
      <div className="mb-4">
        <button className="rounded border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50" onClick={() => void downloadApiFile("/api/calendar-events/export.ics", "governance-calendar.ics")}>
          Export ICS
        </button>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Calendar events">
          <DataTable
            rows={data.calendarEvents}
            empty="No calendar events found."
            columns={[
              { header: "Event", cell: (row) => <div><div className="font-semibold">{row.title}</div><div className="text-xs text-muted">{row.description}</div></div> },
              { header: "Type", cell: (row) => row.event_type },
              { header: "Date", cell: (row) => row.event_date },
              { header: "Owner", cell: (row) => data.users.find((user) => user.id === row.owner_id)?.name ?? "Unassigned" },
            ]}
          />
        </Panel>
        <CompactForm
          title="Create event"
          initialValues={{ title: "", event_type: "meeting", event_date: nextMonth(), owner_id: "", description: "" }}
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "event_type", label: "Type", type: "select", options: eventTypeOptions, required: true },
            { name: "event_date", label: "Date", type: "date", required: true },
            { name: "owner_id", label: "Owner", type: "select", options: userOptions(data.users) },
            { name: "description", label: "Description", type: "textarea" },
          ]}
          onSubmit={async (values) => {
            await apiRequest<CalendarEvent>("/api/calendar-events", {
              method: "POST",
              body: JSON.stringify({ ...values, owner_id: values.owner_id ? Number(values.owner_id) : null }),
            });
            await data.reload();
          }}
        />
      </div>
    </>
  );
}

export function WorkflowsScreen() {
  const data = usePortalData();
  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  return (
    <>
      <PageHeader title="Approval Workflows" description="Configure policy approval steps, approvers, sequence, decisions, and comments." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Workflow steps">
          <DataTable
            rows={data.workflowSteps}
            empty="No workflow steps configured."
            columns={[
              { header: "Policy", cell: (row) => data.policies.find((policy) => policy.id === row.policy_id)?.title ?? `Policy #${row.policy_id}` },
              { header: "Step", cell: (row) => `${row.sequence}. ${row.step_name}` },
              { header: "Approver", cell: (row) => data.users.find((user) => user.id === row.approver_id)?.name ?? "Unknown" },
              { header: "Status", cell: (row) => <StatusChip status={row.status} /> },
              {
                header: "Update",
                cell: (row) => (
                  <select
                    value={row.status}
                    className="rounded border border-line bg-white px-2 py-1 text-xs"
                    onChange={async (event) => {
                      await apiRequest<WorkflowStep>(`/api/workflow-steps/${row.id}`, { method: "PUT", body: JSON.stringify({ status: event.target.value }) });
                      await data.reload();
                    }}
                  >
                    {workflowStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ),
              },
            ]}
          />
        </Panel>
        <CompactForm
          title="Add approval step"
          initialValues={{ policy_id: String(data.policies[0]?.id ?? ""), step_name: "Review", approver_id: String(data.users[0]?.id ?? ""), sequence: "1", status: "pending", comments: "" }}
          fields={[
            { name: "policy_id", label: "Policy", type: "select", options: policyOptions(data.policies), required: true },
            { name: "step_name", label: "Step name", required: true },
            { name: "approver_id", label: "Approver", type: "select", options: userOptions(data.users), required: true },
            { name: "sequence", label: "Sequence", required: true },
            { name: "status", label: "Status", type: "select", options: workflowStatusOptions, required: true },
            { name: "comments", label: "Comments", type: "textarea" },
          ]}
          onSubmit={async (values) => {
            await apiRequest<WorkflowStep>("/api/workflow-steps", {
              method: "POST",
              body: JSON.stringify({ ...values, policy_id: Number(values.policy_id), approver_id: Number(values.approver_id), sequence: Number(values.sequence) }),
            });
            await data.reload();
          }}
        />
      </div>
    </>
  );
}

export function ComplianceScreen() {
  const data = usePortalData();
  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  return (
    <>
      <PageHeader title="Compliance Obligations" description="Track internal, regulatory, and governance obligations with owners, due dates, and evidence." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Obligation register">
          <DataTable
            rows={data.complianceObligations}
            empty="No compliance obligations found."
            columns={[
              { header: "Obligation", cell: (row) => <div><div className="font-semibold">{row.title}</div><div className="text-xs text-muted">{row.description}</div></div> },
              { header: "Source", cell: (row) => row.source },
              { header: "Owner", cell: (row) => data.users.find((user) => user.id === row.owner_id)?.name ?? "Unassigned" },
              { header: "Due", cell: (row) => row.due_date ?? "None" },
              { header: "Status", cell: (row) => <StatusChip status={row.status} /> },
              {
                header: "Update",
                cell: (row) => (
                  <select
                    value={row.status}
                    className="rounded border border-line bg-white px-2 py-1 text-xs"
                    onChange={async (event) => {
                      await apiRequest<ComplianceObligation>(`/api/compliance-obligations/${row.id}`, { method: "PUT", body: JSON.stringify({ status: event.target.value }) });
                      await data.reload();
                    }}
                  >
                    {complianceStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ),
              },
            ]}
          />
        </Panel>
        <CompactForm
          title="Create obligation"
          initialValues={{ tenant_id: String(data.tenants[0]?.id ?? ""), title: "", source: "internal", owner_id: "", due_date: nextMonth(), status: "not_started", description: "" }}
          fields={[
            { name: "tenant_id", label: "Tenant", type: "select", options: tenantOptions(data.tenants) },
            { name: "title", label: "Title", required: true },
            { name: "source", label: "Source", required: true },
            { name: "owner_id", label: "Owner", type: "select", options: userOptions(data.users) },
            { name: "due_date", label: "Due date", type: "date" },
            { name: "status", label: "Status", type: "select", options: complianceStatusOptions, required: true },
            { name: "description", label: "Description", type: "textarea" },
          ]}
          onSubmit={async (values) => {
            await apiRequest<ComplianceObligation>("/api/compliance-obligations", {
              method: "POST",
              body: JSON.stringify({
                ...values,
                tenant_id: values.tenant_id ? Number(values.tenant_id) : null,
                owner_id: values.owner_id ? Number(values.owner_id) : null,
                due_date: values.due_date || null,
              }),
            });
            await data.reload();
          }}
        />
      </div>
    </>
  );
}

export function RisksScreen() {
  const data = usePortalData();
  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  return (
    <>
      <PageHeader title="Risk Register" description="Track governance, compliance, operational, and vendor risks with severity and mitigation plans." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Risk register">
          <DataTable
            rows={data.risks}
            empty="No risks found."
            columns={[
              { header: "Risk", cell: (row) => <div><div className="font-semibold">{row.title}</div><div className="text-xs text-muted">{row.mitigation_plan}</div></div> },
              { header: "Category", cell: (row) => row.category },
              { header: "Severity", cell: (row) => <StatusChip status={row.severity} /> },
              { header: "Status", cell: (row) => <StatusChip status={row.status} /> },
              { header: "Owner", cell: (row) => data.users.find((user) => user.id === row.owner_id)?.name ?? "Unassigned" },
              {
                header: "Update",
                cell: (row) => (
                  <select
                    value={row.status}
                    className="rounded border border-line bg-white px-2 py-1 text-xs"
                    onChange={async (event) => {
                      await apiRequest<Risk>(`/api/risks/${row.id}`, { method: "PUT", body: JSON.stringify({ status: event.target.value }) });
                      await data.reload();
                    }}
                  >
                    {riskStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ),
              },
            ]}
          />
        </Panel>
        <CompactForm
          title="Create risk"
          initialValues={{ tenant_id: String(data.tenants[0]?.id ?? ""), title: "", category: "governance", severity: "medium", status: "open", owner_id: "", mitigation_plan: "" }}
          fields={[
            { name: "tenant_id", label: "Tenant", type: "select", options: tenantOptions(data.tenants) },
            { name: "title", label: "Title", required: true },
            { name: "category", label: "Category", required: true },
            { name: "severity", label: "Severity", type: "select", options: riskSeverityOptions, required: true },
            { name: "status", label: "Status", type: "select", options: riskStatusOptions, required: true },
            { name: "owner_id", label: "Owner", type: "select", options: userOptions(data.users) },
            { name: "mitigation_plan", label: "Mitigation plan", type: "textarea" },
          ]}
          onSubmit={async (values) => {
            await apiRequest<Risk>("/api/risks", {
              method: "POST",
              body: JSON.stringify({
                ...values,
                tenant_id: values.tenant_id ? Number(values.tenant_id) : null,
                owner_id: values.owner_id ? Number(values.owner_id) : null,
              }),
            });
            await data.reload();
          }}
        />
      </div>
    </>
  );
}

export function ReportsScreen() {
  const data = usePortalData();
  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  const rows = [
    { metric: "Open actions", value: data.reports?.open_actions ?? 0, interpretation: "Items requiring owner follow-up" },
    { metric: "Overdue items", value: data.reports?.overdue_items ?? 0, interpretation: "Governance commitments past due date" },
    { metric: "Published policies", value: data.reports?.published_policies ?? 0, interpretation: "Approved and live policy documents" },
    { metric: "Pending approvals", value: data.reports?.pending_approvals ?? 0, interpretation: "Policies in review or approval workflow" },
    { metric: "Upcoming meetings", value: data.reports?.upcoming_meetings ?? 0, interpretation: "Scheduled committee or board sessions" },
    { metric: "Unread notifications", value: data.reports?.unread_notifications ?? 0, interpretation: "Alerts still requiring user attention" },
    { metric: "Documents", value: data.reports?.documents ?? 0, interpretation: "Uploaded governance evidence and records" },
    { metric: "Active integrations", value: data.reports?.active_integrations ?? 0, interpretation: "Configured system connections" },
  ];

  return (
    <>
      <PageHeader title="Governance Reports" description="Executive reporting across policy lifecycle, governance operations, and control readiness." />
      <div className="mb-4">
        <button className="rounded border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50" onClick={() => void downloadApiFile("/api/reports/export", "governance-report.csv")}>
          Export report CSV
        </button>
      </div>
      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Policy lifecycle">
          <MiniBarChart rows={data.reportBreakdown.policy_status} />
        </Panel>
        <Panel title="Compliance status">
          <MiniBarChart rows={data.reportBreakdown.compliance_status} />
        </Panel>
        <Panel title="Risk severity">
          <MiniBarChart rows={data.reportBreakdown.risk_severity} />
        </Panel>
        <Panel title="Upcoming meetings by month">
          <MiniBarChart rows={data.reportBreakdown.upcoming_meetings_by_month} />
        </Panel>
      </div>
      <Panel title="KPI summary">
        <DataTable
          rows={rows}
          empty="No report data available."
          columns={[
            { header: "Metric", cell: (row) => row.metric },
            { header: "Value", cell: (row) => <span className="text-lg font-semibold">{row.value}</span> },
            { header: "Interpretation", cell: (row) => row.interpretation },
          ]}
        />
      </Panel>
    </>
  );
}

export function TenantsScreen() {
  const data = usePortalData();
  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  return (
    <>
      <PageHeader title="Multi-Entity Governance" description="Manage companies, subsidiaries, and tenant-level governance boundaries." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Tenants">
          <DataTable
            rows={data.tenants}
            empty="No tenants found."
            columns={[
              { header: "Name", cell: (row) => row.name },
              { header: "Domain", cell: (row) => row.domain ?? "Not set" },
              { header: "Status", cell: (row) => row.is_active ? "Active" : "Inactive" },
              { header: "Created", cell: (row) => new Date(row.created_at).toLocaleDateString() },
            ]}
          />
        </Panel>
        <CompactForm
          title="Create tenant"
          initialValues={{ name: "", domain: "" }}
          fields={[
            { name: "name", label: "Name", required: true },
            { name: "domain", label: "Domain" },
          ]}
          onSubmit={async (values) => {
            await apiRequest<Tenant>("/api/tenants", { method: "POST", body: JSON.stringify({ name: values.name, domain: values.domain || null, is_active: true }) });
            await data.reload();
          }}
        />
      </div>
    </>
  );
}

export function IntegrationsScreen() {
  const data = usePortalData();
  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  return (
    <>
      <PageHeader title="Risk and Compliance Integrations" description="Configure external risk register, compliance portal, vendor risk, and reporting connections." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Integration connections">
          <DataTable
            rows={data.integrations}
            empty="No integrations configured."
            columns={[
              { header: "Name", cell: (row) => row.name },
              { header: "Type", cell: (row) => row.integration_type },
              { header: "Endpoint", cell: (row) => row.endpoint_url ?? "Manual" },
              { header: "Status", cell: (row) => <StatusChip status={row.status} /> },
              {
                header: "Sync",
                cell: (row) => (
                  <button
                    className="text-xs font-semibold text-primary"
                    onClick={async () => {
                      await apiRequest(`/api/integrations/${row.id}/sync`, { method: "POST" });
                      await data.reload();
                    }}
                  >
                    Run
                  </button>
                ),
              },
            ]}
          />
        </Panel>
        <CompactForm
          title="Create integration"
          initialValues={{ tenant_id: String(data.tenants[0]?.id ?? ""), name: "", integration_type: "compliance", endpoint_url: "", status: "configured" }}
          fields={[
            { name: "tenant_id", label: "Tenant", type: "select", options: tenantOptions(data.tenants) },
            { name: "name", label: "Name", required: true },
            { name: "integration_type", label: "Type", required: true },
            { name: "endpoint_url", label: "Endpoint URL" },
            { name: "status", label: "Status", type: "select", options: integrationStatusOptions, required: true },
          ]}
          onSubmit={async (values) => {
            await apiRequest<IntegrationConnection>("/api/integrations", {
              method: "POST",
              body: JSON.stringify({ ...values, tenant_id: values.tenant_id ? Number(values.tenant_id) : null, endpoint_url: values.endpoint_url || null }),
            });
            await data.reload();
          }}
        />
      </div>
    </>
  );
}

export function SSOScreen() {
  const data = usePortalData();
  const [ssoMessage, setSsoMessage] = useState<string | null>(null);
  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  return (
    <>
      <PageHeader title="SSO Providers" description="Configure SAML or OIDC identity providers for enterprise authentication handoff." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Identity providers">
          <DataTable
            rows={data.ssoProviders}
            empty="No SSO providers configured."
            columns={[
              { header: "Name", cell: (row) => row.name },
              { header: "Type", cell: (row) => row.provider_type },
              { header: "Metadata", cell: (row) => row.metadata_url ?? "Not set" },
              { header: "Status", cell: (row) => <StatusChip status={row.status} /> },
              {
                header: "Test",
                cell: (row) => (
                  <button
                    className="text-xs font-semibold text-primary"
                    onClick={async () => {
                      const response = await apiRequest<{ status: string; redirect_url: string | null; message: string }>(`/api/sso-providers/${row.id}/login`);
                      setSsoMessage(`${row.name}: ${response.status} - ${response.message}`);
                    }}
                  >
                    Start
                  </button>
                ),
              },
              {
                header: "Callback",
                cell: (row) => (
                  <button
                    className="text-xs font-semibold text-primary"
                    onClick={async () => {
                      const user = data.users[0];
                      if (!user) return;
                      const response = await apiRequest<{ status: string; message: string }>("/api/sso-providers/callback", {
                        method: "POST",
                        body: JSON.stringify({ provider_id: row.id, email: user.email, external_subject: `demo-${user.id}` }),
                      });
                      setSsoMessage(`${row.name}: ${response.status} - ${response.message}`);
                      await data.reload();
                    }}
                  >
                    Verify
                  </button>
                ),
              },
            ]}
          />
          {ssoMessage ? <div className="mt-3 rounded border border-line bg-slate-50 px-3 py-2 text-sm text-muted">{ssoMessage}</div> : null}
        </Panel>
        <CompactForm
          title="Create provider"
          initialValues={{ tenant_id: String(data.tenants[0]?.id ?? ""), name: "", provider_type: "saml", metadata_url: "", status: "disabled" }}
          fields={[
            { name: "tenant_id", label: "Tenant", type: "select", options: tenantOptions(data.tenants) },
            { name: "name", label: "Name", required: true },
            { name: "provider_type", label: "Provider type", required: true },
            { name: "metadata_url", label: "Metadata URL" },
            { name: "status", label: "Status", type: "select", options: ssoStatusOptions, required: true },
          ]}
          onSubmit={async (values) => {
            await apiRequest<SSOProvider>("/api/sso-providers", {
              method: "POST",
              body: JSON.stringify({ ...values, tenant_id: values.tenant_id ? Number(values.tenant_id) : null, metadata_url: values.metadata_url || null }),
            });
            await data.reload();
          }}
        />
      </div>
    </>
  );
}

export function AuditLogsScreen() {
  const data = usePortalData();
  const [filters, setFilters] = useState({ action: "", entity_type: "", actor_id: "", date_from: "", date_to: "" });
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[] | null>(null);
  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;
  const auditRows = filteredLogs ?? data.auditLogs;
  const auditQuery = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) auditQuery.set(key, value);
  });
  const auditPath = `/api/audit-logs${auditQuery.toString() ? `?${auditQuery.toString()}` : ""}`;
  const auditExportPath = `/api/audit-logs/export${auditQuery.toString() ? `?${auditQuery.toString()}` : ""}`;

  return (
    <>
      <PageHeader title="Audit Logs" description="Immutable audit trail for user actions, record changes, and governance activity." />
      <div className="mb-4 grid gap-3 rounded border border-line bg-panel p-4 md:grid-cols-6">
        <input value={filters.action} onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))} placeholder="Action" className="rounded border border-line px-3 py-2 text-sm outline-none focus:border-primary" />
        <input value={filters.entity_type} onChange={(event) => setFilters((current) => ({ ...current, entity_type: event.target.value }))} placeholder="Entity type" className="rounded border border-line px-3 py-2 text-sm outline-none focus:border-primary" />
        <select value={filters.actor_id} onChange={(event) => setFilters((current) => ({ ...current, actor_id: event.target.value }))} className="rounded border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="">All actors</option>
          {data.users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
        </select>
        <input value={filters.date_from} onChange={(event) => setFilters((current) => ({ ...current, date_from: event.target.value }))} type="date" className="rounded border border-line px-3 py-2 text-sm outline-none focus:border-primary" />
        <input value={filters.date_to} onChange={(event) => setFilters((current) => ({ ...current, date_to: event.target.value }))} type="date" className="rounded border border-line px-3 py-2 text-sm outline-none focus:border-primary" />
        <div className="flex gap-2">
          <button
            className="rounded bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            onClick={async () => setFilteredLogs(await apiRequest<AuditLog[]>(auditPath))}
          >
            Apply
          </button>
          <button className="rounded border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50" onClick={() => { setFilters({ action: "", entity_type: "", actor_id: "", date_from: "", date_to: "" }); setFilteredLogs(null); }}>
            Reset
          </button>
        </div>
      </div>
      <div className="mb-4">
        <button className="rounded border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50" onClick={() => void downloadApiFile(auditExportPath, "audit-logs.csv")}>
          Export CSV
        </button>
      </div>
      <Panel title="Recent audit events">
        <DataTable
          rows={auditRows}
          empty="No audit logs found."
          columns={[
            { header: "Action", cell: (row) => row.action },
            { header: "Entity", cell: (row) => `${row.entity_type} #${row.entity_id ?? "-"}` },
            { header: "Actor", cell: (row) => data.users.find((user) => user.id === row.actor_id)?.name ?? "System" },
            { header: "Created", cell: (row) => new Date(row.created_at).toLocaleString() },
          ]}
        />
      </Panel>
    </>
  );
}

export function SettingsScreen() {
  const data = usePortalData();
  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  return (
    <>
      <PageHeader title="Users, Roles, and Settings" description="Manage platform users, role-based access, and department assignments." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="Users">
          <DataTable
            rows={data.users}
            empty="No users found."
            columns={[
              { header: "Name", cell: (row) => <div><div className="font-semibold">{row.name}</div><div className="text-xs text-muted">{row.email}</div></div> },
              { header: "Role", cell: (row) => row.role },
              { header: "Department", cell: (row) => data.departments.find((department) => department.id === row.department_id)?.name ?? "Unassigned" },
            ]}
          />
        </Panel>
        <CompactForm
          title="Create user"
          initialValues={{ name: "", email: "", password: "ChangeMe@123", role: "Manager", department_id: "" }}
          fields={[
            { name: "name", label: "Name", required: true },
            { name: "email", label: "Email", type: "email", required: true },
            { name: "password", label: "Temporary password", type: "password", required: true },
            { name: "role", label: "Role", type: "select", options: roleOptions, required: true },
            { name: "department_id", label: "Department", type: "select", options: departmentOptions(data.departments) },
          ]}
          onSubmit={async (values) => {
            await apiRequest<User>("/api/users", {
              method: "POST",
              body: JSON.stringify({ ...values, department_id: values.department_id ? Number(values.department_id) : null }),
            });
            await data.reload();
          }}
        />
      </div>
    </>
  );
}
