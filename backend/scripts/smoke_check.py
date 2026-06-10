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
            "/api/audit-logs": 7,
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

        report_breakdown = client.get("/api/reports/breakdown", headers=headers)
        report_breakdown.raise_for_status()
        breakdown = report_breakdown.json()
        if len(breakdown["policy_status"]) != 5 or len(breakdown["action_status"]) != 4:
            raise AssertionError("Report breakdown did not include expected status groups")

        report_export = client.get("/api/reports/export", headers=headers)
        report_export.raise_for_status()
        if "summary,open_actions,6" not in report_export.text:
            raise AssertionError("Report export did not include summary KPIs")

        audit_filter = client.get("/api/audit-logs", params={"entity_type": "policy"}, headers=headers)
        audit_filter.raise_for_status()
        if not audit_filter.json() or any(row["entity_type"] != "policy" for row in audit_filter.json()):
            raise AssertionError("Audit entity_type filter failed")

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

    print("Backend smoke check passed")


if __name__ == "__main__":
    main()
