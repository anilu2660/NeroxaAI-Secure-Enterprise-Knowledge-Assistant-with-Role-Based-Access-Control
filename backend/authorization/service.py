from fastapi import HTTPException, status

from backend.models.document import Document
from backend.models.user import User
from backend.roles.service import role_service

ROLE_DEPARTMENTS: dict[str, set[str]] = {
    "admin": set(),
    "hr": {"HR", "General"},
    "finance": {"Finance", "General"},
    "engineering": {"Engineering", "General"},
    "sales": {"Sales", "General"},
    "employee": {"General"},
}


class AuthorizationService:
    @staticmethod
    def _role(user: User) -> str:
        return (user.role_id or "").strip().lower()

    @staticmethod
    def _department(user: User) -> str:
        return (user.department or "").strip()

    @staticmethod
    def is_admin(user: User) -> bool:
        return AuthorizationService._role(user) == "admin"

    @staticmethod
    def has_permission(user: User, permission: str) -> bool:
        return role_service.has_permission(
            AuthorizationService._role(user),
            permission,
        )

    @staticmethod
    def can_access_document(user: User, document: Document) -> bool:
        if not user.is_active:
            return False

        if AuthorizationService.is_admin(user):
            return True

        if document.owner_id == user.id:
            return True

        if user.id in (document.shared_with or []):
            return True

        role_departments = ROLE_DEPARTMENTS.get(
            AuthorizationService._role(user),
            set(),
        )

        allowed_departments = set(role_departments)
        user_department = AuthorizationService._department(user)

        if user_department:
            allowed_departments.add(user_department)

        return document.department in allowed_departments

    @staticmethod
    def require_document_access(
        user: User,
        document: Document,
    ) -> None:
        if not AuthorizationService.can_access_document(user, document):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this document.",
            )

    @staticmethod
    def can_share_document(
        user: User,
        document: Document,
    ) -> bool:
        if not AuthorizationService.has_permission(user, "share"):
            return False

        return AuthorizationService.can_access_document(user, document)

    @staticmethod
    def require_share_permission(
        user: User,
        document: Document,
    ) -> None:
        if not AuthorizationService.can_share_document(user, document):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to share this document.",
            )

    @staticmethod
    def can_delete_document(
        user: User,
        document: Document,
    ) -> bool:
        if not AuthorizationService.has_permission(user, "delete"):
            return False

        return AuthorizationService.is_admin(user)

    @staticmethod
    def require_delete_permission(
        user: User,
        document: Document,
    ) -> None:
        if not AuthorizationService.can_delete_document(user, document):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this document.",
            )

    @staticmethod
    def can_upload_to_department(
        user: User,
        department: str,
    ) -> bool:
        if not AuthorizationService.has_permission(user, "upload"):
            return False

        if AuthorizationService.is_admin(user):
            return True

        normalized_department = department.strip()
        allowed_departments = ROLE_DEPARTMENTS.get(
            AuthorizationService._role(user),
            set(),
        )

        return normalized_department in allowed_departments

    @staticmethod
    def require_upload_permission(
        user: User,
        department: str,
    ) -> None:
        if not AuthorizationService.can_upload_to_department(
            user,
            department,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to upload documents to this department.",
            )


authorization_service = AuthorizationService()
