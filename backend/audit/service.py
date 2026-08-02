"""
Audit Service

Business logic for writing and querying compliance audit trail logs.
"""

import logging
from sqlalchemy.orm import Session
from backend.models.audit_log import AuditLog
from backend.audit.schemas import AuditLogCreate

logger = logging.getLogger(__name__)


class AuditService:
    """
    Compliance audit trail service.
    """

    @staticmethod
    def log_event(db: Session, event_data: AuditLogCreate) -> AuditLog:
        """
        Record a compliance audit log entry in the database.
        """
        log_entry = AuditLog(
            event_type=event_data.event_type,
            user_id=event_data.user_id,
            user_email=event_data.user_email,
            user_role=event_data.user_role,
            action=event_data.action,
            resource=event_data.resource,
            ip_address=event_data.ip_address,
            details=event_data.details,
        )

        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)

        logger.info("AUDIT LOG [%s] | User: %s | Action: %s", event_data.event_type, event_data.user_email, event_data.action)
        return log_entry

    @staticmethod
    def get_logs(
        db: Session,
        event_type: str | None = None,
        user_id: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[AuditLog]:
        """
        Retrieve audit logs with optional filtering (Admin only).
        """
        query = db.query(AuditLog)

        if event_type:
            query = query.filter(AuditLog.event_type == event_type)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)

        return query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()


audit_service = AuditService()
