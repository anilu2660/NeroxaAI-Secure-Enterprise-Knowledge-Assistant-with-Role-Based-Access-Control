"""
Structured Entity Lookup Service

Provides deterministic, SQL-backed directory and entity lookups for enterprise
users, departments, roles, and metadata before resorting to probabilistic text generation.
"""

import logging
import re
from sqlalchemy import or_
from backend.database.session import SessionLocal
from backend.models.user import User

logger = logging.getLogger(__name__)


class StructuredEntityLookup:
    """Deterministic, structured lookup for organizational directory and employee facts."""

    _EMPLOYEE_LOOKUP_PATTERNS = [
        re.compile(r"\bwho is\s+([A-Za-z\s]+?)(?:\?|\.|\s*$)", re.I),
        re.compile(r"(?:what\s+is\s+|tell\s+me\s+about\s+)?([A-Za-z\s]+?)(?:'s|\s+is)\s+(role|designation|department|email|status)", re.I),
        re.compile(r"\bfind employee\s+([A-Za-z\s]+?)(?:\?|\.|\s*$)", re.I),
        re.compile(r"\bdepartment head\s+(?:of|for)\s+([A-Za-z\s]+?)(?:\?|\.|\s*$)", re.I),
    ]

    _STOP_WORDS = {"what", "is", "our", "the", "a", "an", "this", "that", "company", "enterprise", "organization"}

    def match_employee_query(self, query: str) -> str | None:
        """Extract target employee or person name from query if present."""
        clean = re.sub(r"[?!.,;]+$", "", query.strip())
        for pattern in self._EMPLOYEE_LOOKUP_PATTERNS:
            match = pattern.search(clean)
            if match:
                candidate = match.group(1).strip()
                tokens = [w for w in candidate.split() if w.lower() not in self._STOP_WORDS]
                if len(tokens) >= 1 and len(" ".join(tokens)) >= 3:
                    return " ".join(tokens)
        return None

    def lookup_employee(self, name_query: str) -> dict | None:
        """Query PostgreSQL users table directly with parameterized exact/ILIKE lookup."""
        if not name_query or len(name_query) < 2:
            return None

        db = SessionLocal()
        try:
            search_pattern = f"%{name_query.strip()}%"
            user = (
                db.query(User)
                .filter(
                    or_(
                        User.full_name.ilike(search_pattern),
                        User.email.ilike(search_pattern),
                    )
                )
                .first()
            )
            if not user:
                return None

            return {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "department": user.department,
                "role": user.role_id,
                "is_active": user.is_active,
                "phone_number": user.phone_number,
            }
        except Exception as exc:
            logger.warning("Structured employee lookup failed: %s", str(exc))
            return None
        finally:
            db.close()

    def format_employee_response(self, record: dict) -> str:
        """Format verified directory record into clean enterprise Markdown."""
        return (
            f"### Executive Overview\n\n"
            f"Verified employee directory record for **{record['full_name']}**:\n\n"
            f"| Attribute | Verified Value |\n"
            f"|---|---|\n"
            f"| **Full Name** | {record['full_name']} |\n"
            f"| **Department** | {record['department']} |\n"
            f"| **Role / Title** | {record['role'].capitalize()} |\n"
            f"| **Corporate Email** | {record['email']} |\n"
            f"| **Status** | {'Active' if record['is_active'] else 'Inactive'} |\n\n"
            f"[Source: Enterprise Identity Directory, Record ID: {record['id'][:8]}]"
        )


structured_lookup = StructuredEntityLookup()
