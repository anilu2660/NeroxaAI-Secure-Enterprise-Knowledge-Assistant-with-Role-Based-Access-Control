"""
Pytest Test Configuration & Shared Fixtures

Provides test database sessions, mock clients, and authentication headers
for unit and integration tests.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.main import app
from backend.database.base import Base
from backend.database.session import get_db, seed_initial_data
from backend.auth.jwt_handler import create_access_token

# In-memory SQLite database for fast unit testing
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """
    Fixture providing a fresh in-memory SQLite database session per test.
    """
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    seed_initial_data(session)

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """
    Fixture providing a FastAPI TestClient with overridden database dependency.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_headers(db_session):
    """
    Fixture returning JWT authorization headers for an Admin user.
    """
    token = create_access_token(
        data={"sub": "admin_uuid", "email": "admin@enterprise.com", "role": "admin", "department": "General"}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def employee_headers(db_session):
    """
    Fixture returning JWT authorization headers for a standard Employee user.
    """
    token = create_access_token(
        data={"sub": "emp_uuid", "email": "employee@enterprise.com", "role": "employee", "department": "General"}
    )
    return {"Authorization": f"Bearer {token}"}
