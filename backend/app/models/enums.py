from enum import StrEnum


class Role(StrEnum):
    ADMIN = "Admin"
    GOVERNANCE_OFFICER = "Governance Officer"
    MANAGER = "Manager"
    AUDITOR = "Auditor"
    BOARD_MEMBER = "Board Member"


class PolicyStatus(StrEnum):
    DRAFT = "draft"
    REVIEW = "review"
    APPROVAL = "approval"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class ReviewStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ActionStatus(StrEnum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETE = "complete"
    OVERDUE = "overdue"


class NotificationStatus(StrEnum):
    UNREAD = "unread"
    READ = "read"


class CalendarEventType(StrEnum):
    MEETING = "meeting"
    REVIEW = "review"
    AUDIT = "audit"
    RENEWAL = "renewal"


class WorkflowStepStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class IntegrationStatus(StrEnum):
    CONFIGURED = "configured"
    DISABLED = "disabled"


class SSOProviderStatus(StrEnum):
    ENABLED = "enabled"
    DISABLED = "disabled"


class RiskStatus(StrEnum):
    OPEN = "open"
    MITIGATING = "mitigating"
    CLOSED = "closed"


class RiskSeverity(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ComplianceStatus(StrEnum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"


class DeliveryStatus(StrEnum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class SyncStatus(StrEnum):
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"
