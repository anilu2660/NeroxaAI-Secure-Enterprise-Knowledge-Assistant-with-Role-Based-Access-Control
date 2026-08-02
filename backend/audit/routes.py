"""
Audit Routes

API endpoints for viewing compliance audit logs (Admin only).
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.audit.schemas import AuditLogResponse
from backend.audit.service import audit_service
from backend.roles.middleware import require_admin

router = APIRouter(prefix="/api/v1/admin/audit-logs", tags=["Audit & Compliance"])


@router.get(
    "/",
    response_model=list[AuditLogResponse],
    summary="Get compliance audit logs (Admin only)",
    description="Retrieve system audit trail events (logins, uploads, queries, role changes). Restricted to Admin.",
)
def get_audit_logs(
    event_type: str | None = None,
    user_id: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin_role: str = Depends(require_admin),
):
    """
    Query system audit trail logs. Admin authorization required.
    """
    return audit_service.get_logs(
        db=db,
        event_type=event_type,
        user_id=user_id,
        skip=skip,
        limit=limit,
    )
