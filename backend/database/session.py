"""
Database Session Manager

Configures SQLAlchemy engine, session maker, and provides session dependencies
for FastAPI routes.
"""

import os
import logging
from typing import Generator
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, Session
from backend.config import settings
from backend.database.base import Base

logger = logging.getLogger(__name__)

is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    settings.DATABASE_URL,
    echo="warning" if not settings.DEBUG else False,
    pool_pre_ping=True,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error("Database session error: %s", str(e))
        raise
    finally:
        db.close()


def seed_initial_data(db: Session) -> None:
    """Seed default system roles and create an initial admin account if not existing."""
    from backend.models.role import Role
    from backend.models.user import User
    from backend.roles.service import ROLE_PERMISSIONS, ROLE_DESCRIPTIONS
    from backend.auth.password import hash_password

    try:
        for role_name, perms in ROLE_PERMISSIONS.items():
            existing_role = db.query(Role).filter(Role.id == role_name).first()
            if not existing_role:
                new_role = Role(
                    id=role_name,
                    name=role_name.capitalize(),
                    description=ROLE_DESCRIPTIONS.get(role_name, ""),
                    permissions=sorted(list(perms)),
                )
                db.add(new_role)

        db.commit()

        admin_email = os.getenv("ADMIN_EMAIL")
        admin_password = os.getenv("ADMIN_PASSWORD")
        if not admin_email or not admin_password:
            logger.warning(
                "ADMIN_EMAIL or ADMIN_PASSWORD not set in environment. "
                "Skipping default admin seed. Set these env vars to create the initial admin."
            )
        else:
            admin_user = db.query(User).filter(User.email == admin_email).first()
            if not admin_user:
                admin_user = User(
                    email=admin_email,
                    hashed_password=hash_password(admin_password),
                    full_name="Enterprise Admin",
                    department="General",
                    role_id="admin",
                    is_active=True,
                    is_superuser=True,
                )
                db.add(admin_user)
                db.commit()
                logger.info("Default Admin account seeded for: %s", admin_email)

    except Exception as e:
        db.rollback()
        logger.error("Failed to seed initial database data: %s", str(e))


def _ensure_chat_message_metadata_column() -> None:
    """
    Backward-compatible schema upgrade for existing deployments.

    Base.metadata.create_all() does not add columns to an already-created table.
    This tiny idempotent upgrade keeps older installations bootable after Phase C.
    A formal Alembic migration can replace this startup check later.
    """
    try:
        inspector = inspect(engine)
        columns = {column["name"] for column in inspector.get_columns("chat_messages")}
        if "execution_metadata" in columns:
            return

        with engine.begin() as connection:
            # JSON is supported by PostgreSQL and SQLite's JSON affinity.
            connection.execute(
                text("ALTER TABLE chat_messages ADD COLUMN execution_metadata JSON")
            )
        logger.info("Added chat_messages.execution_metadata column.")
    except Exception as e:
        # Do not silently continue: the API would otherwise fail only when a
        # chat response is persisted, which is much harder to diagnose.
        logger.error("Failed to upgrade chat_messages schema: %s", str(e))
        raise


def init_db() -> None:
    """Create tables, apply small compatibility upgrades, and seed initial data."""
    try:
        logger.info("Initializing database tables...")
        import backend.models  # noqa: F401
        Base.metadata.create_all(bind=engine)
        _ensure_chat_message_metadata_column()
        logger.info("Database tables initialized successfully.")

        db = SessionLocal()
        try:
            seed_initial_data(db)
        finally:
            db.close()

    except Exception as e:
        logger.error("Failed to initialize database tables: %s", str(e))
        raise
