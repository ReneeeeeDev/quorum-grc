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

