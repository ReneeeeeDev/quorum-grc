import os
import sys
import tempfile
from pathlib import Path

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("JWT_SECRET_KEY", "smoke-test-secret")
backend_root = Path(__file__).resolve().parents[1]
os.environ.setdefault("FILE_STORAGE_PATH", str(Path(tempfile.gettempdir()) / "gmp-smoke-documents"))
sys.path.insert(0, str(backend_root))

from fastapi.testclient import TestClient

from app.main import app


def main() -> None:
    with TestClient(app) as client:
        health = client.get("/health")
        assert health.status_code == 200, health.text

        login = client.post("/api/auth/login", json={"email": "admin@gmp.local", "password": "Admin@123"})
        assert login.status_code == 200, login.text
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        users = client.get("/api/users", headers=headers)
        assert users.status_code == 200, users.text
        owner_id = users.json()[0]["id"]

        policy = client.post(
            "/api/policies",
            headers=headers,
            json={"title": "Smoke Test Policy", "version": "1.0", "status": "approval", "owner_id": owner_id},
        )
        assert policy.status_code == 201, policy.text

        reports = client.get("/api/reports", headers=headers)
        assert reports.status_code == 200, reports.text
        assert reports.json()["pending_approvals"] >= 1

        tenants = client.get("/api/tenants", headers=headers)
        assert tenants.status_code == 200, tenants.text
        tenant_id = tenants.json()[0]["id"]

        document = client.post(
            "/api/documents",
            headers=headers,
            json={
                "tenant_id": tenant_id,
                "title": "Smoke Test Document",
                "filename": "smoke-test.pdf",
                "content_type": "application/pdf",
                "file_size": 128,
                "storage_path": "storage/documents/smoke-test.pdf",
                "linked_entity_type": "policy",
                "linked_entity_id": policy.json()["id"],
            },
        )
        assert document.status_code == 201, document.text

        uploaded_document = client.post(
            "/api/documents/upload",
            headers=headers,
            data={"tenant_id": str(tenant_id), "title": "Uploaded Smoke Document"},
            files={"file": ("smoke.txt", b"hello governance", "text/plain")},
        )
        assert uploaded_document.status_code == 201, uploaded_document.text
        download = client.get(f"/api/documents/{uploaded_document.json()['id']}/download", headers=headers)
        assert download.status_code == 200, download.text

        notification = client.post(
            "/api/notifications",
            headers=headers,
            json={"tenant_id": tenant_id, "user_id": owner_id, "title": "Smoke Alert", "message": "Verify notifications"},
        )
        assert notification.status_code == 201, notification.text

        calendar = client.post(
            "/api/calendar-events",
            headers=headers,
            json={"tenant_id": tenant_id, "title": "Smoke Governance Review", "event_type": "review", "event_date": "2026-07-01"},
        )
        assert calendar.status_code == 201, calendar.text

        workflow = client.post(
            "/api/workflow-steps",
            headers=headers,
            json={"tenant_id": tenant_id, "policy_id": policy.json()["id"], "step_name": "Approval", "approver_id": owner_id, "sequence": 1},
        )
        assert workflow.status_code == 201, workflow.text

        integration = client.post(
            "/api/integrations",
            headers=headers,
            json={"tenant_id": tenant_id, "name": "Smoke Compliance", "integration_type": "compliance", "endpoint_url": "https://example.com/api"},
        )
        assert integration.status_code == 201, integration.text

        sso = client.post(
            "/api/sso-providers",
            headers=headers,
            json={"tenant_id": tenant_id, "name": "Smoke IdP", "provider_type": "saml", "metadata_url": "https://idp.example/metadata"},
        )
        assert sso.status_code == 201, sso.text

        reset = client.post("/api/auth/password-reset/request", json={"email": "auditor@gmp.local"})
        assert reset.status_code == 200, reset.text
        reset_token = reset.json()["reset_token"]
        confirm = client.post("/api/auth/password-reset/confirm", json={"token": reset_token, "new_password": "Auditor@123"})
        assert confirm.status_code == 200, confirm.text

        compliance = client.post(
            "/api/compliance-obligations",
            headers=headers,
            json={"tenant_id": tenant_id, "title": "Smoke Compliance Obligation", "source": "internal", "owner_id": owner_id},
        )
        assert compliance.status_code == 201, compliance.text

        risk = client.post(
            "/api/risks",
            headers=headers,
            json={"tenant_id": tenant_id, "title": "Smoke Risk", "category": "governance", "severity": "high", "owner_id": owner_id},
        )
        assert risk.status_code == 201, risk.text

        dispatch = client.post(f"/api/notifications/{notification.json()['id']}/dispatch", headers=headers)
        assert dispatch.status_code == 200, dispatch.text

        sync = client.post(f"/api/integrations/{integration.json()['id']}/sync", headers=headers)
        assert sync.status_code == 200, sync.text

        ics = client.get("/api/calendar-events/export.ics", headers=headers)
        assert ics.status_code == 200, ics.text
        assert "BEGIN:VCALENDAR" in ics.text

        audit_export = client.get("/api/audit-logs/export", headers=headers)
        assert audit_export.status_code == 200, audit_export.text
        assert "id,actor_id,action" in audit_export.text

    print("Backend smoke check passed")


if __name__ == "__main__":
    main()
