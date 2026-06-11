import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("JWT_SECRET_KEY", "smoke-test-secret")
os.environ.setdefault("DEMO_SEED_ENABLED", "true")

from fastapi.testclient import TestClient

from app.main import app


def main() -> None:
    with TestClient(app) as client:
        health_response = client.get("/health")
        health_response.raise_for_status()
        if health_response.headers.get("X-Content-Type-Options") != "nosniff":
            raise AssertionError("Security headers are missing")

        readiness_response = client.get("/health/ready")
        readiness_response.raise_for_status()
        if readiness_response.json().get("database") != "ok":
            raise AssertionError("Readiness check did not confirm database connectivity")

        login_response = client.post(
            "/api/auth/login",
            json={"email": "admin@gmp.local", "password": "Admin@123"},
        )
        login_response.raise_for_status()
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        expected_list_counts = {
            "/api/users": 10,
            "/api/departments": 10,
            "/api/policies": 9,
            "/api/meetings": 5,
            "/api/decisions": 5,
            "/api/action-items": 7,
            "/api/audit-logs": 8,
            "/api/documents": 5,
            "/api/calendar-events": 6,
            "/api/workflow-steps": 5,
            "/api/integrations": 5,
            "/api/sso-providers": 3,
            "/api/compliance-obligations": 5,
            "/api/risks": 6,
        }
        for path, expected_count in expected_list_counts.items():
            response = client.get(path, headers=headers)
            response.raise_for_status()
            actual_count = len(response.json())
            if actual_count != expected_count:
                raise AssertionError(f"{path}: expected {expected_count}, got {actual_count}")

        report_response = client.get("/api/reports", headers=headers)
        report_response.raise_for_status()
        expected_report = {
            "open_actions": 6,
            "overdue_items": 2,
            "published_policies": 3,
            "pending_approvals": 4,
            "upcoming_meetings": 4,
            "unread_notifications": 5,
            "documents": 5,
            "active_integrations": 4,
        }
        if report_response.json() != expected_report:
            raise AssertionError(f"/api/reports mismatch: {report_response.json()}")

        production_readiness = client.get("/api/ops/production-readiness", headers=headers)
        production_readiness.raise_for_status()
        readiness_body = production_readiness.json()
        if readiness_body.get("status") not in {"ready", "action_required"}:
            raise AssertionError("Production readiness endpoint returned an invalid status")
        if not readiness_body.get("checks"):
            raise AssertionError("Production readiness endpoint did not return checks")

        report_breakdown = client.get("/api/reports/breakdown", headers=headers)
        report_breakdown.raise_for_status()
        breakdown = report_breakdown.json()
        if len(breakdown["policy_status"]) != 5 or len(breakdown["action_status"]) != 4:
            raise AssertionError("Report breakdown did not include expected status groups")

        report_export = client.get("/api/reports/export", headers=headers)
        report_export.raise_for_status()
        if "summary,open_actions,6" not in report_export.text:
            raise AssertionError("Report export did not include summary KPIs")

        paged_policies = client.get("/api/policies", params={"limit": 1, "offset": 0}, headers=headers)
        paged_policies.raise_for_status()
        if len(paged_policies.json()) != 1:
            raise AssertionError("Policy pagination limit was not honored")
        if paged_policies.headers.get("X-Total-Count") != "9":
            raise AssertionError("Policy pagination total count header was not returned")

        audit_filter = client.get("/api/audit-logs", params={"entity_type": "policy"}, headers=headers)
        audit_filter.raise_for_status()
        if not audit_filter.json() or any(row["entity_type"] != "policy" for row in audit_filter.json()):
            raise AssertionError("Audit entity_type filter failed")

        failed_login = client.post(
            "/api/auth/login",
            json={"email": "admin@gmp.local", "password": "WrongPassword@123"},
        )
        if failed_login.status_code != 401:
            raise AssertionError(f"Failed login should return 401, got {failed_login.status_code}")
        auth_audit = client.get("/api/audit-logs", params={"entity_type": "auth"}, headers=headers)
        auth_audit.raise_for_status()
        auth_actions = {row["action"] for row in auth_audit.json()}
        if {"auth.login_success", "auth.login_failed"} - auth_actions:
            raise AssertionError("Auth audit logs should include successful and failed login events")

        sso_start = client.get("/api/sso-providers/1/login")
        sso_start.raise_for_status()
        if sso_start.json()["status"] != "ready":
            raise AssertionError("Enabled SSO provider should be ready")

        sso_callback = client.post(
            "/api/sso-providers/callback",
            json={"provider_id": 1, "email": "admin@gmp.local", "external_subject": "admin-idp-subject"},
        )
        sso_callback.raise_for_status()
        if sso_callback.json()["status"] != "authenticated" or not sso_callback.json()["access_token"]:
            raise AssertionError("SSO callback did not issue a mapped user token")

        auditor_login = client.post(
            "/api/auth/login",
            json={"email": "auditor@gmp.local", "password": "Auditor@123"},
        )
        auditor_login.raise_for_status()
        auditor_headers = {"Authorization": f"Bearer {auditor_login.json()['access_token']}"}
        forbidden_write = client.post(
            "/api/policies",
            headers=auditor_headers,
            json={"title": "Unauthorized Policy", "version": "1.0", "owner_id": 3},
        )
        if forbidden_write.status_code != 403:
            raise AssertionError(f"Auditor write should be forbidden, got {forbidden_write.status_code}")

        public_login = client.post(
            "/api/auth/login",
            json={"email": "public-auditor@gmp.local", "password": "PublicAudit@123"},
        )
        public_login.raise_for_status()
        public_headers = {"Authorization": f"Bearer {public_login.json()['access_token']}"}
        public_policies = client.get("/api/policies", headers=public_headers)
        public_policies.raise_for_status()
        if len(public_policies.json()) != 1:
            raise AssertionError("Tenant-scoped auditor should only see one public tenant policy")
        public_notifications = client.get("/api/notifications", headers=public_headers)
        public_notifications.raise_for_status()
        public_unread = [notification for notification in public_notifications.json() if notification["status"] == "unread"]
        public_report = client.get("/api/reports", headers=public_headers)
        public_report.raise_for_status()
        if public_report.json()["unread_notifications"] != len(public_unread):
            raise AssertionError("Public auditor unread notification KPI should match visible unread notifications")
        public_actions = client.get("/api/action-items", headers=public_headers)
        public_actions.raise_for_status()
        if public_actions.json():
            raise AssertionError("Auditors should not receive action items from direct API calls")

        manager_login = client.post(
            "/api/auth/login",
            json={"email": "manager@gmp.local", "password": "Manager@123"},
        )
        manager_login.raise_for_status()
        manager_headers = {"Authorization": f"Bearer {manager_login.json()['access_token']}"}
        manager_policies = client.get("/api/policies", headers=manager_headers)
        manager_policies.raise_for_status()
        if len(manager_policies.json()) != 0:
            raise AssertionError("Manager should not see tenant-wide policies they do not own")
        manager_actions = client.get("/api/action-items", headers=manager_headers)
        manager_actions.raise_for_status()
        if len(manager_actions.json()) != 1:
            raise AssertionError("Manager should only see assigned action items")

        board_login = client.post(
            "/api/auth/login",
            json={"email": "board@gmp.local", "password": "Board@123"},
        )
        board_login.raise_for_status()
        board_headers = {"Authorization": f"Bearer {board_login.json()['access_token']}"}
        board_policies = client.get("/api/policies", headers=board_headers)
        board_policies.raise_for_status()
        if any(policy["status"] != "published" for policy in board_policies.json()):
            raise AssertionError("Board members should only see published policies")
        board_audit_logs = client.get("/api/audit-logs", headers=board_headers)
        board_audit_logs.raise_for_status()
        if board_audit_logs.json():
            raise AssertionError("Board members should not see audit logs")

    print("Backend smoke check passed")


if __name__ == "__main__":
    main()
