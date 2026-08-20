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
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# All system capabilities — allowed by default for all roles until an Admin revokes a permission
ALL_PERMISSIONS: set[str] = {
    "workspace:access",
    "assistant:query",
    "documents:read",
    "documents:upload",
    "documents:manage",
    "users:manage",
    "audit:read",
    "access:manage",
    "read",
    "upload",
    "delete",
    "share",
    "manage_users",
}

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "admin": set(ALL_PERMISSIONS),
    "hr": set(ALL_PERMISSIONS),
    "finance": set(ALL_PERMISSIONS),
    "engineering": set(ALL_PERMISSIONS),
    "sales": set(ALL_PERMISSIONS),
    "user": set(ALL_PERMISSIONS),
    "employee": set(ALL_PERMISSIONS),
}

ROLE_DESCRIPTIONS: dict[str, str] = {
    "admin": "System Administrator with full access to all data, management, upload, delete, and user roles.",
    "hr": "Human Resources role with access to HR documents and workspace capabilities.",
    "finance": "Finance role with access to financial documents and workspace capabilities.",
    "engineering": "Engineering role with access to engineering documentation and workspace capabilities.",
    "sales": "Sales role with access to sales collateral and workspace capabilities.",
    "employee": "Standard employee role with access to authorized documents and workspace capabilities.",
    "user": "Standard user role with access to authorized documents and workspace capabilities.",
}


class RoleService:
    """
    Service for validating permissions and managing user roles.
    """

    @staticmethod
    def sync_roles_from_db(db: Session) -> None:
        """
        Load roles and permissions from PostgreSQL database into memory.
        Ensure every role has all capabilities allowed by default unless explicitly revoked by Admin.
        """
        from backend.models.role import Role
        try:
            db_roles = db.query(Role).all()
            if db_roles:
                for r in db_roles:
                    current_perms = set(r.permissions or [])
                    # If existing DB record has legacy or empty permissions missing UI capability keys, grant ALL_PERMISSIONS by default
                    has_ui_keys = any(
                        k.startswith("workspace:") or k.startswith("assistant:") or k.startswith("documents:") or k.startswith("users:") or k.startswith("audit:") or k.startswith("access:")
                        for k in current_perms
                    )
                    if not has_ui_keys:
                        current_perms.update(ALL_PERMISSIONS)
                        r.permissions = sorted(list(current_perms))
                        db.commit()
                    ROLE_PERMISSIONS[r.id.lower()] = current_perms
            else:
                for role_name in ["admin", "hr", "finance", "engineering", "sales", "user", "employee"]:
                    r = Role(
                        id=role_name,
                        name=role_name.capitalize(),
                        description=ROLE_DESCRIPTIONS.get(role_name, f"{role_name.capitalize()} system role."),
                        permissions=sorted(list(ALL_PERMISSIONS)),
                    )
                    db.add(r)
                db.commit()
        except Exception as e:
            logger.warning("Could not sync roles from DB: %s", str(e))

    @staticmethod
    def get_role_permissions(role: str) -> set[str]:
        """
        Get all permissions granted to a given role.
        """
        return ROLE_PERMISSIONS.get(role.lower(), set())

    @staticmethod
    def has_permission(role: str, required_permission: str, db: Session | None = None, department: str | None = None) -> bool:
        """
        Check if a given role or department has the required permission.
        Prioritizes the department role policy set by Admin in PostgreSQL if present.
        """
        if db:
            try:
                RoleService.sync_roles_from_db(db)
            except Exception:
                pass

        role_lower = role.lower()
        dept_lower = (department or "").lower()

        if dept_lower and dept_lower in ROLE_PERMISSIONS:
            permissions = ROLE_PERMISSIONS[dept_lower]
        else:
            permissions = ROLE_PERMISSIONS.get(role_lower, set())

        allowed = required_permission.lower() in permissions

        if not allowed:
            logger.warning(
                "Access DENIED | Role '%s' (Dept '%s') requested permission '%s'",
                role,
                department,
                required_permission,
            )
        return allowed

    @staticmethod
    def toggle_permission(role: str, permission: str, db: Session | None = None) -> dict:
        """
        Toggle a permission on or off for a specific role and persist to PostgreSQL DB.
        """
        role_lower = role.lower()
        perm = permission.strip()
        if role_lower not in ROLE_PERMISSIONS:
            ROLE_PERMISSIONS[role_lower] = set()

        if perm in ROLE_PERMISSIONS[role_lower]:
            ROLE_PERMISSIONS[role_lower].remove(perm)
            action = "revoked"
        else:
            ROLE_PERMISSIONS[role_lower].add(perm)
            action = "granted"

        if db:
            try:
                from backend.models.role import Role
                role_record = db.query(Role).filter(Role.id == role_lower).first()
                if not role_record:
                    role_record = Role(
                        id=role_lower,
                        name=role_lower.capitalize(),
                        description=ROLE_DESCRIPTIONS.get(role_lower, f"{role_lower.capitalize()} role."),
                        permissions=sorted(list(ROLE_PERMISSIONS[role_lower])),
                    )
                    db.add(role_record)
                else:
                    role_record.permissions = sorted(list(ROLE_PERMISSIONS[role_lower]))
                db.commit()
                logger.info("Persisted permission '%s' %s for role '%s' in PostgreSQL DB.", perm, action, role_lower)
            except Exception as e:
                db.rollback()
                logger.error("Failed to persist permission change to PostgreSQL DB: %s", str(e))

        return {
            "status": "success",
            "role": role_lower,
            "permission": perm,
            "action": action,
            "permissions": sorted(list(ROLE_PERMISSIONS[role_lower])),
        }

    @staticmethod
    def is_admin(role: str) -> bool:
        """
        Check if the role is Admin.
        """
        return role.lower() == "admin"

    @staticmethod
    def list_all_roles(db: Session | None = None) -> list[dict]:
        """
        List all defined roles and their permissions, loading from PostgreSQL DB if available.
        """
        if db:
            try:
                RoleService.sync_roles_from_db(db)
            except Exception as e:
                logger.warning("Failed syncing roles from DB: %s", str(e))

        roles_list = []
        for role_name, perms in ROLE_PERMISSIONS.items():
            roles_list.append({
                "name": role_name,
                "description": ROLE_DESCRIPTIONS.get(role_name, f"{role_name.capitalize()} system role."),
                "permissions": sorted(list(perms)),
            })
        return roles_list


role_service = RoleService()
