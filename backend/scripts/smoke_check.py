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
