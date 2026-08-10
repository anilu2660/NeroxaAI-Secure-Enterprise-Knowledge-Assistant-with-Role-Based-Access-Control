"""
Database Session Manager

Configures SQLAlchemy engine, session maker, and provides session dependencies
for FastAPI routes.
"""

import os
import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from backend.config import settings
from backend.database.base import Base

logger = logging.getLogger(__name__)

# Determine if SQLite is used (for fallback/testing) vs PostgreSQL
is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

# Create SQLAlchemy engine
# SECURITY: echo=True logs all SQL queries including those with user data.
# Use echo="warning" to only log warnings/errors, never full query text.
engine = create_engine(
    settings.DATABASE_URL,
    echo="warning" if not settings.DEBUG else False,
    pool_pre_ping=True,
    connect_args=connect_args,
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session per request
    and closes it automatically when completed.

    Usage:
        @router.get("/users")
        def list_users(db: Session = Depends(get_db)):
            ...
    """
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
    """
    Seed default system roles and create an initial admin account if not existing.
    """
    from backend.models.role import Role
    from backend.models.user import User
    from backend.roles.service import ROLE_PERMISSIONS, ROLE_DESCRIPTIONS
    from backend.auth.password import hash_password

    try:
        # 1. Seed Roles
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

        # 2. Seed Default Admin User
        # SECURITY: Credentials loaded from environment variables — NEVER hardcoded.
        # Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file.
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
                # SECURITY: Never log the password — only log that the account was created.
                logger.info("Default Admin account seeded for: %s", admin_email)

    except Exception as e:
        db.rollback()
        logger.error("Failed to seed initial database data: %s", str(e))


def init_db() -> None:
    """
    Create all tables in the database and seed initial roles + admin user.
    """
    try:
        logger.info("Initializing database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")

        # Seed roles & default admin
        db = SessionLocal()
        try:
            seed_initial_data(db)
        finally:
            db.close()

    except Exception as e:
        logger.error("Failed to initialize database tables: %s", str(e))
        raise
