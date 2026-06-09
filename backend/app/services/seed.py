from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models import (
    ActionItem,
    ActionStatus,
    AuditLog,
    CalendarEvent,
    CalendarEventType,
    ComplianceObligation,
    ComplianceStatus,
    Decision,
    DeliveryStatus,
    Department,
    Document,
    IntegrationConnection,
    IntegrationStatus,
    IntegrationSyncRun,
    Meeting,
    Notification,
    NotificationDelivery,
    NotificationStatus,
    Policy,
    PolicyReview,
    PolicyStatus,
    ReviewStatus,
    Risk,
    RiskSeverity,
    RiskStatus,
    Role,
    SSOProvider,
    SSOProviderStatus,
    SyncStatus,
    Tenant,
    User,
    WorkflowStep,
    WorkflowStepStatus,
)


def seed_database(db: Session) -> None:
    if db.query(User).first():
        return

    today = date.today()

    tenants = [
        Tenant(name="Acme Enterprise", domain="acme.example"),
        Tenant(name="Northwind Public Services", domain="northwind.example"),
    ]
    db.add_all(tenants)
    db.flush()
    acme, northwind = tenants

    departments = [
        Department(name="Governance Office", tenant_id=acme.id),
        Department(name="Compliance", tenant_id=acme.id),
        Department(name="Internal Audit", tenant_id=acme.id),
        Department(name="Board Secretariat", tenant_id=acme.id),
        Department(name="Legal", tenant_id=acme.id),
        Department(name="Information Security", tenant_id=acme.id),
        Department(name="Operations", tenant_id=acme.id),
        Department(name="Risk Management", tenant_id=acme.id),
        Department(name="Public Governance Office", tenant_id=northwind.id),
        Department(name="Public Audit Committee", tenant_id=northwind.id),
    ]
    db.add_all(departments)
    db.flush()
    dept = {department.name: department for department in departments}

    user_specs = [
        ("Platform Admin", "admin@gmp.local", "Admin@123", Role.ADMIN, "Governance Office", acme.id),
        ("Governance Officer", "governance@gmp.local", "Governance@123", Role.GOVERNANCE_OFFICER, "Governance Office", acme.id),
        ("Internal Auditor", "auditor@gmp.local", "Auditor@123", Role.AUDITOR, "Internal Audit", acme.id),
        ("Board Member", "board@gmp.local", "Board@123", Role.BOARD_MEMBER, "Board Secretariat", acme.id),
        ("Operations Manager", "manager@gmp.local", "Manager@123", Role.MANAGER, "Operations", acme.id),
        ("Legal Manager", "legal@gmp.local", "Legal@123", Role.MANAGER, "Legal", acme.id),
        ("Security Manager", "security@gmp.local", "Security@123", Role.MANAGER, "Information Security", acme.id),
        ("Risk Manager", "risk@gmp.local", "Risk@123", Role.MANAGER, "Risk Management", acme.id),
        (
            "Public Governance Lead",
            "public-governance@gmp.local",
            "Public@123",
            Role.GOVERNANCE_OFFICER,
            "Public Governance Office",
            northwind.id,
        ),
        ("Public Auditor", "public-auditor@gmp.local", "PublicAudit@123", Role.AUDITOR, "Public Audit Committee", northwind.id),
    ]
    users = [
        User(
            name=name,
            email=email,
            hashed_password=get_password_hash(password),
            role=role,
            tenant_id=tenant_id,
            department_id=dept[department_name].id,
        )
        for name, email, password, role, department_name, tenant_id in user_specs
    ]
    db.add_all(users)
    db.flush()
    user = {record.email: record for record in users}

    dept["Governance Office"].head_id = user["governance@gmp.local"].id
    dept["Compliance"].head_id = user["legal@gmp.local"].id
    dept["Internal Audit"].head_id = user["auditor@gmp.local"].id
    dept["Board Secretariat"].head_id = user["board@gmp.local"].id
    dept["Information Security"].head_id = user["security@gmp.local"].id
    dept["Operations"].head_id = user["manager@gmp.local"].id
    dept["Risk Management"].head_id = user["risk@gmp.local"].id
    dept["Public Governance Office"].head_id = user["public-governance@gmp.local"].id
    dept["Public Audit Committee"].head_id = user["public-auditor@gmp.local"].id

    policy_specs = [
        ("Enterprise Governance Charter", "2.1", PolicyStatus.PUBLISHED, "governance@gmp.local", today - timedelta(days=120), "Committee mandate, approval authority, and escalation model."),
        ("Delegation of Authority Matrix", "1.4", PolicyStatus.APPROVAL, "legal@gmp.local", today + timedelta(days=14), "Financial, operational, and board-level decision thresholds."),
        ("Policy Lifecycle Standard", "3.0", PolicyStatus.REVIEW, "governance@gmp.local", today + timedelta(days=30), "Drafting, review, approval, publication, and archival controls."),
        ("Audit Evidence Retention Policy", "1.2", PolicyStatus.PUBLISHED, "auditor@gmp.local", today - timedelta(days=45), "Evidence ownership, retention periods, and audit traceability requirements."),
        ("Information Security Governance Policy", "2.0", PolicyStatus.REVIEW, "security@gmp.local", today + timedelta(days=20), "Security committee reporting, risk acceptance, and exception handling."),
        ("Operational Risk Escalation Procedure", "1.0", PolicyStatus.DRAFT, "risk@gmp.local", None, "Risk intake, scoring, escalation, and mitigation accountability."),
        ("Board Reporting Calendar Standard", "1.1", PolicyStatus.PUBLISHED, "board@gmp.local", today - timedelta(days=10), "Board pack cadence, report ownership, and submission deadlines."),
        ("Third Party Governance Policy", "1.3", PolicyStatus.ARCHIVED, "legal@gmp.local", today - timedelta(days=300), "Superseded third-party review and vendor governance policy."),
        ("Public Services Governance Charter", "1.0", PolicyStatus.REVIEW, "public-governance@gmp.local", today + timedelta(days=40), "Northwind public-service committee governance model."),
    ]
    policies = [
        Policy(
            tenant_id=acme.id if owner_email != "public-governance@gmp.local" else northwind.id,
            title=title,
            version=version,
            status=status,
            owner_id=user[owner_email].id,
            effective_date=effective_date,
            summary=summary,
        )
        for title, version, status, owner_email, effective_date, summary in policy_specs
    ]
    db.add_all(policies)
    db.flush()

    reviews = [
        PolicyReview(policy_id=policies[1].id, reviewer_id=user["board@gmp.local"].id, status=ReviewStatus.PENDING, comments="Awaiting board consent."),
        PolicyReview(policy_id=policies[2].id, reviewer_id=user["auditor@gmp.local"].id, status=ReviewStatus.APPROVED, comments="Audit controls are clear."),
        PolicyReview(policy_id=policies[2].id, reviewer_id=user["legal@gmp.local"].id, status=ReviewStatus.PENDING, comments="Legal language review in progress."),
        PolicyReview(policy_id=policies[4].id, reviewer_id=user["risk@gmp.local"].id, status=ReviewStatus.REJECTED, comments="Risk acceptance wording needs revision."),
        PolicyReview(policy_id=policies[8].id, reviewer_id=user["public-auditor@gmp.local"].id, status=ReviewStatus.PENDING, comments="Evidence mapping requested."),
    ]
    db.add_all(reviews)

    meetings = [
        Meeting(tenant_id=acme.id, title="Monthly Governance Committee", meeting_date=today - timedelta(days=12), committee_id=dept["Governance Office"].id, agenda="Policy approvals, overdue actions, risk escalations.", minutes="Approved charter updates and escalated three overdue actions."),
        Meeting(tenant_id=acme.id, title="Board Governance Review", meeting_date=today + timedelta(days=9), committee_id=dept["Board Secretariat"].id, agenda="Delegation matrix approval and governance KPI review."),
        Meeting(tenant_id=acme.id, title="Audit Readiness Standup", meeting_date=today + timedelta(days=2), committee_id=dept["Internal Audit"].id, agenda="Evidence gaps, retention controls, and remediation owners."),
        Meeting(tenant_id=acme.id, title="Information Security Governance Forum", meeting_date=today + timedelta(days=16), committee_id=dept["Information Security"].id, agenda="Security policy review and exception reporting."),
        Meeting(tenant_id=northwind.id, title="Public Services Oversight Committee", meeting_date=today + timedelta(days=21), committee_id=dept["Public Governance Office"].id, agenda="Public charter review and compliance obligations."),
    ]
    db.add_all(meetings)
    db.flush()

    decisions = [
        Decision(tenant_id=acme.id, meeting_id=meetings[0].id, description="Approve Enterprise Governance Charter v2.1 for publication.", decision_date=today - timedelta(days=12), owner_id=user["governance@gmp.local"].id),
        Decision(tenant_id=acme.id, meeting_id=meetings[0].id, description="Escalate overdue evidence collection to department heads.", decision_date=today - timedelta(days=12), owner_id=user["auditor@gmp.local"].id),
        Decision(tenant_id=acme.id, meeting_id=meetings[1].id, description="Present Delegation of Authority Matrix for final board approval.", decision_date=today + timedelta(days=9), owner_id=user["board@gmp.local"].id),
        Decision(tenant_id=acme.id, meeting_id=meetings[3].id, description="Require quarterly security governance exception reporting.", decision_date=today + timedelta(days=16), owner_id=user["security@gmp.local"].id),
        Decision(tenant_id=northwind.id, meeting_id=meetings[4].id, description="Adopt public service governance evidence checklist.", decision_date=today + timedelta(days=21), owner_id=user["public-governance@gmp.local"].id),
    ]
    db.add_all(decisions)
    db.flush()

    action_items = [
        ActionItem(tenant_id=acme.id, decision_id=decisions[0].id, title="Publish approved governance charter in document library", assigned_to=user["governance@gmp.local"].id, due_date=today + timedelta(days=3), status=ActionStatus.IN_PROGRESS),
        ActionItem(tenant_id=acme.id, decision_id=decisions[1].id, title="Collect audit evidence from Compliance and Operations", assigned_to=user["auditor@gmp.local"].id, due_date=today - timedelta(days=4), status=ActionStatus.OVERDUE),
        ActionItem(tenant_id=acme.id, decision_id=decisions[2].id, title="Prepare board approval pack for delegation matrix", assigned_to=user["legal@gmp.local"].id, due_date=today + timedelta(days=7), status=ActionStatus.OPEN),
        ActionItem(tenant_id=acme.id, decision_id=decisions[3].id, title="Draft exception reporting template for security governance", assigned_to=user["security@gmp.local"].id, due_date=today + timedelta(days=12), status=ActionStatus.OPEN),
        ActionItem(tenant_id=acme.id, decision_id=decisions[1].id, title="Validate overdue action owner list", assigned_to=user["manager@gmp.local"].id, due_date=today - timedelta(days=1), status=ActionStatus.OVERDUE),
        ActionItem(tenant_id=acme.id, decision_id=decisions[0].id, title="Archive superseded third-party governance policy", assigned_to=user["legal@gmp.local"].id, due_date=today - timedelta(days=8), status=ActionStatus.COMPLETE),
        ActionItem(tenant_id=northwind.id, decision_id=decisions[4].id, title="Map public service evidence checklist to obligations", assigned_to=user["public-auditor@gmp.local"].id, due_date=today + timedelta(days=14), status=ActionStatus.IN_PROGRESS),
    ]
    db.add_all(action_items)

    documents = [
        Document(tenant_id=acme.id, title="Governance Charter Approval Pack", filename="governance-charter-approval-pack.pdf", content_type="application/pdf", file_size=428000, storage_path="storage/documents/governance-charter-approval-pack.pdf", linked_entity_type="policy", linked_entity_id=policies[0].id, uploaded_by=user["governance@gmp.local"].id),
        Document(tenant_id=acme.id, title="Audit Evidence Register Q2", filename="audit-evidence-register-q2.xlsx", content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", file_size=312000, storage_path="storage/documents/audit-evidence-register-q2.xlsx", linked_entity_type="audit", linked_entity_id=None, uploaded_by=user["auditor@gmp.local"].id),
        Document(tenant_id=acme.id, title="Delegation Matrix Board Pack", filename="delegation-matrix-board-pack.pdf", content_type="application/pdf", file_size=510000, storage_path="storage/documents/delegation-matrix-board-pack.pdf", linked_entity_type="policy", linked_entity_id=policies[1].id, uploaded_by=user["legal@gmp.local"].id),
        Document(tenant_id=acme.id, title="Security Governance Exceptions", filename="security-governance-exceptions.csv", content_type="text/csv", file_size=64000, storage_path="storage/documents/security-governance-exceptions.csv", linked_entity_type="risk", linked_entity_id=None, uploaded_by=user["security@gmp.local"].id),
        Document(tenant_id=northwind.id, title="Public Services Evidence Checklist", filename="public-services-evidence-checklist.docx", content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", file_size=121000, storage_path="storage/documents/public-services-evidence-checklist.docx", linked_entity_type="policy", linked_entity_id=policies[8].id, uploaded_by=user["public-governance@gmp.local"].id),
    ]
    db.add_all(documents)
    db.flush()

    notifications = [
        Notification(tenant_id=acme.id, user_id=user["governance@gmp.local"].id, title="Policy review due", message="Policy Lifecycle Standard needs final governance review.", status=NotificationStatus.UNREAD, due_date=today + timedelta(days=5)),
        Notification(tenant_id=acme.id, user_id=user["auditor@gmp.local"].id, title="Evidence collection overdue", message="Two audit evidence actions are overdue.", status=NotificationStatus.UNREAD, due_date=today - timedelta(days=1)),
        Notification(tenant_id=acme.id, user_id=user["board@gmp.local"].id, title="Board approval pack ready", message="Delegation matrix pack is queued for board review.", status=NotificationStatus.READ, due_date=today + timedelta(days=9)),
        Notification(tenant_id=acme.id, user_id=user["security@gmp.local"].id, title="Security governance review", message="Exception reporting template requires review.", status=NotificationStatus.UNREAD, due_date=today + timedelta(days=12)),
        Notification(tenant_id=northwind.id, user_id=user["public-auditor@gmp.local"].id, title="Public evidence checklist assigned", message="Evidence checklist mapping is due in two weeks.", status=NotificationStatus.UNREAD, due_date=today + timedelta(days=14)),
        Notification(tenant_id=acme.id, user_id=None, title="Governance committee reminder", message="Monthly governance committee is scheduled next week.", status=NotificationStatus.UNREAD, due_date=today + timedelta(days=7)),
    ]
    db.add_all(notifications)
    db.flush()

    db.add_all(
        [
            NotificationDelivery(notification_id=notifications[0].id, channel="email", recipient="governance@gmp.local", status=DeliveryStatus.SENT),
            NotificationDelivery(notification_id=notifications[1].id, channel="email", recipient="auditor@gmp.local", status=DeliveryStatus.FAILED, error="SMTP sandbox unavailable"),
            NotificationDelivery(notification_id=notifications[3].id, channel="in_app", recipient="security@gmp.local", status=DeliveryStatus.SENT),
        ]
    )

    calendar_events = [
        CalendarEvent(tenant_id=acme.id, title="Quarterly Governance Committee", event_type=CalendarEventType.MEETING, event_date=today + timedelta(days=7), owner_id=user["governance@gmp.local"].id, description="Review policy lifecycle, action items, and governance KPIs."),
        CalendarEvent(tenant_id=acme.id, title="Delegation Matrix Approval", event_type=CalendarEventType.REVIEW, event_date=today + timedelta(days=9), owner_id=user["board@gmp.local"].id, description="Board review of delegation matrix."),
        CalendarEvent(tenant_id=acme.id, title="Audit Evidence Walkthrough", event_type=CalendarEventType.AUDIT, event_date=today + timedelta(days=2), owner_id=user["auditor@gmp.local"].id, description="Validate evidence completeness for audit readiness."),
        CalendarEvent(tenant_id=acme.id, title="Security Policy Renewal", event_type=CalendarEventType.RENEWAL, event_date=today + timedelta(days=35), owner_id=user["security@gmp.local"].id, description="Renew security governance policy."),
        CalendarEvent(tenant_id=acme.id, title="Operational Risk Review", event_type=CalendarEventType.MEETING, event_date=today + timedelta(days=18), owner_id=user["risk@gmp.local"].id, description="Review high and critical operational risks."),
        CalendarEvent(tenant_id=northwind.id, title="Public Governance Evidence Review", event_type=CalendarEventType.REVIEW, event_date=today + timedelta(days=24), owner_id=user["public-governance@gmp.local"].id, description="Review public-service evidence checklist."),
    ]
    db.add_all(calendar_events)

    workflow_steps = [
        WorkflowStep(tenant_id=acme.id, policy_id=policies[1].id, step_name="Legal sign-off", approver_id=user["legal@gmp.local"].id, sequence=1, status=WorkflowStepStatus.APPROVED, comments="Legal wording confirmed."),
        WorkflowStep(tenant_id=acme.id, policy_id=policies[1].id, step_name="Board approval", approver_id=user["board@gmp.local"].id, sequence=2, status=WorkflowStepStatus.PENDING, comments="Scheduled for next board review."),
        WorkflowStep(tenant_id=acme.id, policy_id=policies[2].id, step_name="Audit control review", approver_id=user["auditor@gmp.local"].id, sequence=1, status=WorkflowStepStatus.APPROVED, comments="Controls are testable."),
        WorkflowStep(tenant_id=acme.id, policy_id=policies[4].id, step_name="Risk exception review", approver_id=user["risk@gmp.local"].id, sequence=1, status=WorkflowStepStatus.REJECTED, comments="Revise exception tolerance language."),
        WorkflowStep(tenant_id=northwind.id, policy_id=policies[8].id, step_name="Public audit review", approver_id=user["public-auditor@gmp.local"].id, sequence=1, status=WorkflowStepStatus.PENDING, comments="Evidence mapping pending."),
    ]
    db.add_all(workflow_steps)

    integrations = [
        IntegrationConnection(tenant_id=acme.id, name="Compliance Portal", integration_type="compliance", endpoint_url="https://compliance.example/api", status=IntegrationStatus.CONFIGURED),
        IntegrationConnection(tenant_id=acme.id, name="Audit Evidence Vault", integration_type="document", endpoint_url="https://evidence.example/api", status=IntegrationStatus.CONFIGURED),
        IntegrationConnection(tenant_id=acme.id, name="Risk Register Sync", integration_type="risk", endpoint_url="https://risk.example/api", status=IntegrationStatus.CONFIGURED),
        IntegrationConnection(tenant_id=acme.id, name="Legacy Policy Repository", integration_type="policy", endpoint_url="https://legacy-policy.example/api", status=IntegrationStatus.DISABLED),
        IntegrationConnection(tenant_id=northwind.id, name="Public Compliance Registry", integration_type="compliance", endpoint_url="https://public-compliance.example/api", status=IntegrationStatus.CONFIGURED),
    ]
    db.add_all(integrations)
    db.flush()

    db.add_all(
        [
            IntegrationSyncRun(integration_id=integrations[0].id, status=SyncStatus.SUCCESS, records_processed=128, message="Compliance obligations synced."),
            IntegrationSyncRun(integration_id=integrations[1].id, status=SyncStatus.SUCCESS, records_processed=42, message="Evidence metadata refreshed."),
            IntegrationSyncRun(integration_id=integrations[2].id, status=SyncStatus.FAILED, records_processed=0, message="Remote risk API returned maintenance response."),
            IntegrationSyncRun(integration_id=integrations[3].id, status=SyncStatus.SKIPPED, records_processed=0, message="Integration disabled."),
        ]
    )

    sso_providers = [
        SSOProvider(tenant_id=acme.id, name="Corporate Identity Provider", provider_type="saml", metadata_url="https://idp.example/metadata", status=SSOProviderStatus.ENABLED),
        SSOProvider(tenant_id=acme.id, name="Azure AD Governance Sandbox", provider_type="oidc", metadata_url="https://login.example/.well-known/openid-configuration", status=SSOProviderStatus.DISABLED),
        SSOProvider(tenant_id=northwind.id, name="Public Services SSO", provider_type="saml", metadata_url="https://public-idp.example/metadata", status=SSOProviderStatus.ENABLED),
    ]
    db.add_all(sso_providers)

    compliance_obligations = [
        ComplianceObligation(tenant_id=acme.id, title="Annual board governance attestation", source="internal", owner_id=user["governance@gmp.local"].id, due_date=today + timedelta(days=60), status=ComplianceStatus.IN_PROGRESS, evidence_document_id=documents[0].id, description="Collect and retain evidence for annual governance attestation."),
        ComplianceObligation(tenant_id=acme.id, title="SOX change approval evidence", source="SOX", owner_id=user["auditor@gmp.local"].id, due_date=today + timedelta(days=18), status=ComplianceStatus.NON_COMPLIANT, evidence_document_id=documents[1].id, description="Evidence missing for two change approval records."),
        ComplianceObligation(tenant_id=acme.id, title="ISO 27001 governance review", source="ISO 27001", owner_id=user["security@gmp.local"].id, due_date=today + timedelta(days=45), status=ComplianceStatus.IN_PROGRESS, evidence_document_id=documents[3].id, description="Security governance review evidence."),
        ComplianceObligation(tenant_id=acme.id, title="Vendor oversight evidence", source="internal", owner_id=user["legal@gmp.local"].id, due_date=today - timedelta(days=10), status=ComplianceStatus.COMPLIANT, evidence_document_id=documents[2].id, description="Vendor oversight evidence retained."),
        ComplianceObligation(tenant_id=northwind.id, title="Public services annual oversight", source="public-sector", owner_id=user["public-governance@gmp.local"].id, due_date=today + timedelta(days=75), status=ComplianceStatus.NOT_STARTED, evidence_document_id=documents[4].id, description="Annual public oversight evidence collection."),
    ]
    db.add_all(compliance_obligations)

    risks = [
        Risk(tenant_id=acme.id, title="Delayed policy approval cycle", category="governance", severity=RiskSeverity.HIGH, status=RiskStatus.MITIGATING, owner_id=user["governance@gmp.local"].id, mitigation_plan="Track overdue approvals through workflow steps and executive dashboard alerts."),
        Risk(tenant_id=acme.id, title="Incomplete audit evidence", category="audit", severity=RiskSeverity.CRITICAL, status=RiskStatus.OPEN, owner_id=user["auditor@gmp.local"].id, mitigation_plan="Escalate missing evidence to department heads and run weekly evidence checks."),
        Risk(tenant_id=acme.id, title="Security exception backlog", category="security", severity=RiskSeverity.HIGH, status=RiskStatus.MITIGATING, owner_id=user["security@gmp.local"].id, mitigation_plan="Require quarterly exception reporting and owner sign-off."),
        Risk(tenant_id=acme.id, title="Outdated third-party governance records", category="vendor", severity=RiskSeverity.MEDIUM, status=RiskStatus.CLOSED, owner_id=user["legal@gmp.local"].id, mitigation_plan="Archived superseded records and linked new vendor review workflow."),
        Risk(tenant_id=acme.id, title="Operational accountability gaps", category="operations", severity=RiskSeverity.MEDIUM, status=RiskStatus.OPEN, owner_id=user["manager@gmp.local"].id, mitigation_plan="Map action ownership to operational managers."),
        Risk(tenant_id=northwind.id, title="Public oversight evidence delay", category="public-sector", severity=RiskSeverity.MEDIUM, status=RiskStatus.OPEN, owner_id=user["public-auditor@gmp.local"].id, mitigation_plan="Adopt checklist and fortnightly evidence reviews."),
    ]
    db.add_all(risks)

    audit_logs = [
        AuditLog(actor_id=user["admin@gmp.local"].id, action="tenant.created", entity_type="tenant", entity_id=acme.id, details="Seeded Acme Enterprise tenant."),
        AuditLog(actor_id=user["governance@gmp.local"].id, action="policy.published", entity_type="policy", entity_id=policies[0].id, details="Enterprise Governance Charter v2.1 published."),
        AuditLog(actor_id=user["auditor@gmp.local"].id, action="evidence.flagged", entity_type="compliance_obligation", entity_id=2, details="SOX evidence gap flagged as non-compliant."),
        AuditLog(actor_id=user["legal@gmp.local"].id, action="policy.submitted", entity_type="policy", entity_id=policies[1].id, details="Delegation matrix submitted for approval."),
        AuditLog(actor_id=user["security@gmp.local"].id, action="workflow.rejected", entity_type="workflow_step", entity_id=4, details="Security governance exception wording needs revision."),
        AuditLog(actor_id=user["manager@gmp.local"].id, action="action.updated", entity_type="action_item", entity_id=5, details="Operational owner validation marked overdue."),
        AuditLog(actor_id=user["public-governance@gmp.local"].id, action="policy.review_requested", entity_type="policy", entity_id=policies[8].id, details="Public governance charter sent to public audit committee."),
    ]
    db.add_all(audit_logs)

    db.commit()
