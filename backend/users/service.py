"""
User Service

Business logic for managing user accounts in the database.
"""

import logging
from sqlalchemy.orm import Session
from backend.models.user import User
from backend.users.schemas import UserUpdate
from backend.utils.exceptions import ResourceNotFoundException

logger = logging.getLogger(__name__)


class UserService:
    """
    CRUD operations for User accounts.
    """

    @staticmethod
    def get_by_id(db: Session, user_id: str) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ResourceNotFoundException(f"User with ID '{user_id}' not found.")
        return user

    @staticmethod
    def get_by_email(db: Session, email: str) -> User:
        user = db.query(User).filter(User.email == email.lower()).first()
        if not user:
            raise ResourceNotFoundException(f"User with email '{email}' not found.")
        return user

    @staticmethod
    def list_users(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def update_user(db: Session, user_id: str, update_data: UserUpdate) -> User:
        user = UserService.get_by_id(db, user_id)

        if update_data.full_name is not None:
            user.full_name = update_data.full_name
        if update_data.department is not None:
            user.department = update_data.department
        if update_data.role_id is not None:
            user.role_id = update_data.role_id
        if update_data.is_active is not None:
            user.is_active = update_data.is_active

        db.commit()
        db.refresh(user)
        logger.info("Updated user '%s' (role=%s, dept=%s)", user.email, user.role_id, user.department)
        return user

    @staticmethod
    def delete_user(db: Session, user_id: str) -> bool:
        user = UserService.get_by_id(db, user_id)
        db.delete(user)
        db.commit()
        logger.info("Deleted user '%s'", user.email)
        return True


user_service = UserService()
