"""
Authentication Service

Handles user registration, login authentication, and JWT token issuance.
"""

import logging
from sqlalchemy.orm import Session
from backend.models.user import User
from backend.auth.password import hash_password, verify_password
from backend.auth.jwt_handler import create_access_token
from backend.auth.schemas import RegisterRequest, LoginRequest
from backend.utils.exceptions import CredentialsException, DuplicateResourceException

logger = logging.getLogger(__name__)


class AuthService:
    """
    Service for registration, credential verification, and JWT generation.
    """

    @staticmethod
    def register_user(db: Session, request: RegisterRequest) -> User:
        """
        Register a new user in the database.
        """
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == request.email.lower()).first()
        if existing_user:
            raise DuplicateResourceException(f"User with email '{request.email}' already exists.")

        hashed_pwd = hash_password(request.password)

        new_user = User(
            email=request.email.lower(),
            hashed_password=hashed_pwd,
            full_name=request.full_name,
            department=request.department,
            role_id=request.role.lower(),
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        logger.info("Registered new user: %s (role=%s, dept=%s)", new_user.email, new_user.role_id, new_user.department)
        return new_user

    @staticmethod
    def authenticate_user(db: Session, request: LoginRequest) -> tuple[User, str]:
        """
        Authenticate user credentials and return User model + JWT access token.
        """
        user = db.query(User).filter(User.email == request.email.lower()).first()
        if not user or not verify_password(request.password, user.hashed_password):
            raise CredentialsException("Invalid email or password.")

        if not user.is_active:
            raise CredentialsException("User account is inactive.")

        # Create JWT payload
        token_data = {
            "sub": user.id,
            "email": user.email,
            "role": user.role_id,
            "department": user.department,
        }

        access_token = create_access_token(data=token_data)
        logger.info("User authenticated: %s", user.email)
        return user, access_token


auth_service = AuthService()
