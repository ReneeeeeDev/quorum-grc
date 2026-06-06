import os
import sys
from pathlib import Path

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("JWT_SECRET_KEY", "smoke-test-secret")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

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

    print("Backend smoke check passed")


if __name__ == "__main__":
    main()
