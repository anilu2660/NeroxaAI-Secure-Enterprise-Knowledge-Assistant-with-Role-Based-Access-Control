"""
Role Service

Business logic for RBAC roles, permission checking, and role assignments.

Role & Permission Matrix (from plan.md):
- Admin: ["read", "upload", "delete", "share", "manage_users"]  (Full Access)
- HR: ["read", "upload", "share"] (HR department docs)
- Finance: ["read", "upload", "share"] (Finance department docs)
- Engineering: ["read", "upload", "share"] (Engineering department docs)
- Sales: ["read", "upload", "share"] (Sales department docs)
- Employee: ["read"] (Authorized docs only)
"""

import logging

logger = logging.getLogger(__name__)

# System Roles and Permitted Actions
ROLE_PERMISSIONS: dict[str, set[str]] = {
    "admin": {"read", "upload", "delete", "share", "manage_users"},
    "hr": {"read", "upload", "share"},
    "finance": {"read", "upload", "share"},
    "engineering": {"read", "upload", "share"},
    "sales": {"read", "upload", "share"},
    "employee": {"read"},
}

ROLE_DESCRIPTIONS: dict[str, str] = {
    "admin": "System Administrator with full access to all data, management, upload, delete, and user roles.",
    "hr": "Human Resources role with access to HR documents and upload capabilities.",
    "finance": "Finance role with access to financial documents and upload capabilities.",
    "engineering": "Engineering role with access to engineering documentation and upload capabilities.",
    "sales": "Sales role with access to sales collateral and upload capabilities.",
    "employee": "Standard employee role with read-only access to authorized general documents.",
}


class RoleService:
    """
    Service for validating permissions and managing user roles.
    """

    @staticmethod
    def get_role_permissions(role: str) -> set[str]:
        """
        Get all permissions granted to a given role.
        """
        return ROLE_PERMISSIONS.get(role.lower(), set())

    @staticmethod
    def has_permission(role: str, required_permission: str) -> bool:
        """
        Check if a given role has the required permission.

        Args:
            role: User's role (admin, hr, etc.)
            required_permission: Permission to check ("upload", "delete", "manage_users", etc.)
        """
        role_lower = role.lower()
        permissions = ROLE_PERMISSIONS.get(role_lower, set())
        allowed = required_permission.lower() in permissions

        if not allowed:
            logger.warning(
                "Access DENIED | Role '%s' requested permission '%s'",
                role,
                required_permission,
            )
        return allowed

    @staticmethod
    def is_admin(role: str) -> bool:
        """
        Check if the role is Admin.
        """
        return role.lower() == "admin"

    @staticmethod
    def list_all_roles() -> list[dict]:
        """
        List all defined roles and their permissions.
        """
        roles_list = []
        for role_name, perms in ROLE_PERMISSIONS.items():
            roles_list.append({
                "name": role_name,
                "description": ROLE_DESCRIPTIONS.get(role_name, ""),
                "permissions": sorted(list(perms)),
            })
        return roles_list


role_service = RoleService()
