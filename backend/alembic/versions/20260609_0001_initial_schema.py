"""Initial schema baseline.

Revision ID: 20260609_0001
Revises:
Create Date: 2026-06-09
"""

from alembic import op
import sqlalchemy as sa

revision = "20260609_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # The MVP still uses SQLAlchemy create_all on startup for local simplicity.
    # This baseline lets production deployments stamp or autogenerate from the current models.
    pass


def downgrade() -> None:
    pass

