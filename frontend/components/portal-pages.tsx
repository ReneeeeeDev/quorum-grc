"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, FileCheck2, ListChecks } from "lucide-react";

import { StatusChip } from "@/components/status-chip";
import { apiRequest } from "@/lib/api";
import type { ActionItem, AuditLog, Decision, Department, Meeting, Policy, ReportSummary, User } from "@/lib/types";

type Field = {
  name: string;
  label: string;
  type?: "text" | "date" | "email" | "password" | "select" | "textarea";
  options?: { label: string; value: string }[];
  required?: boolean;
};

type LoadState = "idle" | "loading" | "ready" | "error";

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

function DataTable<T>({
  rows,
  columns,
  empty,
}: {
  rows: T[];
  columns: { header: string; cell: (row: T) => React.ReactNode }[];
  empty: string;
}) {
  if (!rows.length) {
    return <div className="rounded border border-dashed border-line px-4 py-8 text-center text-sm text-muted">{empty}</div>;
  }

  return (
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
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-line last:border-0">
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
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const reload = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const [nextUsers, nextDepartments, nextPolicies, nextMeetings, nextDecisions, nextActions, nextReports, nextAuditLogs] =
        await Promise.all([
          apiRequest<User[]>("/api/users"),
          apiRequest<Department[]>("/api/departments"),
          apiRequest<Policy[]>("/api/policies"),
          apiRequest<Meeting[]>("/api/meetings"),
          apiRequest<Decision[]>("/api/decisions"),
          apiRequest<ActionItem[]>("/api/action-items"),
          apiRequest<ReportSummary>("/api/reports"),
          apiRequest<AuditLog[]>("/api/audit-logs"),
        ]);
      setUsers(nextUsers);
      setDepartments(nextDepartments);
      setPolicies(nextPolicies);
      setMeetings(nextMeetings);
      setDecisions(nextDecisions);
      setActions(nextActions);
      setReports(nextReports);
      setAuditLogs(nextAuditLogs);
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load portal data");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { state, error, users, departments, policies, meetings, decisions, actions, reports, auditLogs, reload };
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

export function DashboardScreen() {
  const data = usePortalData();

  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  const cards = [
    { label: "Open actions", value: data.reports?.open_actions ?? 0, icon: ListChecks },
    { label: "Overdue items", value: data.reports?.overdue_items ?? 0, icon: AlertTriangle },
    { label: "Published policies", value: data.reports?.published_policies ?? 0, icon: FileCheck2 },
    { label: "Pending approvals", value: data.reports?.pending_approvals ?? 0, icon: Clock },
    { label: "Upcoming meetings", value: data.reports?.upcoming_meetings ?? 0, icon: CheckCircle2 },
  ];

  return (
    <>
      <PageHeader title="Executive Dashboard" description="Governance KPIs, pending accountability items, and recent enterprise activity." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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

export function ReportsScreen() {
  const data = usePortalData();
  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  const rows = [
    { metric: "Open actions", value: data.reports?.open_actions ?? 0, interpretation: "Items requiring owner follow-up" },
    { metric: "Overdue items", value: data.reports?.overdue_items ?? 0, interpretation: "Governance commitments past due date" },
    { metric: "Published policies", value: data.reports?.published_policies ?? 0, interpretation: "Approved and live policy documents" },
    { metric: "Pending approvals", value: data.reports?.pending_approvals ?? 0, interpretation: "Policies in review or approval workflow" },
    { metric: "Upcoming meetings", value: data.reports?.upcoming_meetings ?? 0, interpretation: "Scheduled committee or board sessions" },
  ];

  return (
    <>
      <PageHeader title="Governance Reports" description="Executive reporting across policy lifecycle, governance operations, and control readiness." />
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

export function AuditLogsScreen() {
  const data = usePortalData();
  if (data.state !== "ready") return <LoadingOrError state={data.state} error={data.error} />;

  return (
    <>
      <PageHeader title="Audit Logs" description="Immutable audit trail for user actions, record changes, and governance activity." />
      <Panel title="Recent audit events">
        <DataTable
          rows={data.auditLogs}
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
