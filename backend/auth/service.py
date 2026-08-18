import logging
import secrets
import uuid
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from backend.models.user import User
from backend.auth.password import hash_password, verify_password
from backend.auth.jwt_handler import create_access_token
from backend.auth.schemas import (
    LoginRequest,
    InitiateRegistrationRequest,
    VerifyOTPRequest,
)
from backend.auth.email_service import email_service
from backend.auth.sms_service import sms_service
from backend.utils.exceptions import (
    CredentialsException,
    DuplicateResourceException,
)

logger = logging.getLogger(__name__)

OTP_EXPIRY_MINUTES = 10
MAX_OTP_ATTEMPTS = 5

ALLOWED_DEPARTMENTS = {
    "General",
    "HR",
    "Finance",
    "Engineering",
    "Sales",
}

OTP_SESSIONS: dict[str, dict] = {}


class AuthService:

    @staticmethod
    def initiate_registration(
        db: Session,
        request: InitiateRegistrationRequest,
    ) -> dict:

        email_clean = request.email.lower().strip()
        full_name = request.full_name.strip()
        phone_number = request.phone_number.strip()
        department = request.department.strip()

        if not email_clean:
            raise CredentialsException("Email address is required.")

        if not request.password:
            raise CredentialsException("Password is required.")

        if not full_name:
            raise CredentialsException("Full name is required.")

        if not phone_number:
            raise CredentialsException("Phone number is required.")

        if department not in ALLOWED_DEPARTMENTS:
            raise CredentialsException("Invalid department selected.")

        existing_user = (
            db.query(User)
            .filter(User.email == email_clean)
            .first()
        )

        if existing_user:
            raise DuplicateResourceException(
                "An account with this email already exists."
            )

        email_otp = str(secrets.randbelow(900000) + 100000)
        mobile_otp = str(secrets.randbelow(900000) + 100000)

        session_token = str(uuid.uuid4())

        expires_at = (
            datetime.utcnow()
            + timedelta(minutes=OTP_EXPIRY_MINUTES)
        )

        hashed_password = hash_password(request.password)
        email_otp_hash = hash_password(email_otp)
        mobile_otp_hash = hash_password(mobile_otp)

        requested_role = getattr(request, "requested_role", "employee").strip().lower() or "employee"

        OTP_SESSIONS[session_token] = {
            "email": email_clean,
            "hashed_password": hashed_password,
            "full_name": full_name,
            "phone_number": phone_number,
            "department": department,
            "requested_role": requested_role,
            "email_otp_hash": email_otp_hash,
            "mobile_otp_hash": mobile_otp_hash,
            "expires_at": expires_at,
            "attempts": 0,
        }

        try:
            email_sent = email_service.send_email_otp(
                email_clean,
                full_name,
                email_otp,
            )

            sms_sent = sms_service.send_mobile_otp(
                phone_number,
                mobile_otp,
            )

        except Exception as exc:
            OTP_SESSIONS.pop(session_token, None)

            logger.exception(
                "OTP delivery failed for registration session."
            )

            raise CredentialsException(
                "Unable to send verification codes. Please try again later."
            ) from exc

        if not email_sent or not sms_sent:
            OTP_SESSIONS.pop(session_token, None)

            logger.warning(
                "OTP delivery incomplete | email_sent=%s | sms_sent=%s",
                email_sent,
                sms_sent,
            )

            raise CredentialsException(
                "Unable to deliver verification codes. Please try again later."
            )

        logger.info(
            "OTP registration initiated | email=%s | email_sent=%s | sms_sent=%s",
            email_clean,
            email_sent,
            sms_sent,
        )

        return {
            "session_token": session_token,
            "email": email_clean,
            "phone_number": phone_number,
            "expires_in_minutes": OTP_EXPIRY_MINUTES,
            "message": (
                "Verification OTPs have been sent "
                "to your registered email and mobile number."
            ),
        }

    @staticmethod
    def verify_otp_and_create_user(
        db: Session,
        request: VerifyOTPRequest,
    ) -> tuple[User, str]:

        session_token = request.session_token

        session_data = OTP_SESSIONS.get(session_token)

        if not session_data:
            raise CredentialsException(
                "Invalid or expired verification session. Please register again."
            )

        if datetime.utcnow() > session_data["expires_at"]:
            OTP_SESSIONS.pop(session_token, None)

            raise CredentialsException(
                "Verification session has expired. Please register again."
            )

        attempts = session_data.get("attempts", 0)

        if attempts >= MAX_OTP_ATTEMPTS:
            OTP_SESSIONS.pop(session_token, None)

            raise CredentialsException(
                "Too many verification attempts. Please register again."
            )

        session_data["attempts"] = attempts + 1

        email_otp = request.email_otp.strip()
        mobile_otp = request.mobile_otp.strip()

        if len(email_otp) != 6 or not email_otp.isdigit():
            raise CredentialsException("Invalid verification code.")

        if len(mobile_otp) != 6 or not mobile_otp.isdigit():
            raise CredentialsException("Invalid verification code.")

        try:
            email_valid = verify_password(
                email_otp,
                session_data["email_otp_hash"],
            )
        except Exception:
            email_valid = False

        if not email_valid:
            raise CredentialsException("Invalid verification code.")

        try:
            mobile_valid = sms_service.verify_mobile_otp(
                session_data["phone_number"],
                mobile_otp,
                session_data["mobile_otp_hash"],
            )
        except Exception:
            mobile_valid = False

        if not mobile_valid:
            raise CredentialsException("Invalid verification code.")

        email_clean = session_data["email"]

        existing_user = (
            db.query(User)
            .filter(User.email == email_clean)
            .first()
        )

        if existing_user:
            OTP_SESSIONS.pop(session_token, None)

            raise DuplicateResourceException(
                "An account with this email already exists."
            )

        requested_role = session_data.get("requested_role", "employee")
        new_user = User(
            email=email_clean,
            hashed_password=session_data["hashed_password"],
            full_name=session_data["full_name"],
            phone_number=session_data["phone_number"],
            department=session_data["department"],
            role_id="employee",
            requested_role_id=requested_role,
            is_approved=False,
            is_active=True,
            is_verified=True,
        )

        try:
            db.add(new_user)
            db.commit()
            db.refresh(new_user)

        except Exception as exc:
            db.rollback()

            logger.exception(
                "Failed to create user after OTP verification."
            )

            raise CredentialsException(
                "Unable to create account. Please try again."
            ) from exc

        OTP_SESSIONS.pop(session_token, None)

        token_data = {
            "sub": new_user.id,
            "email": new_user.email,
            "role": new_user.role_id,
            "department": new_user.department,
        }

        access_token = create_access_token(
            data=token_data
        )

        logger.info(
            "User registration completed | user_id=%s | role=%s | department=%s",
            new_user.id,
            new_user.role_id,
            new_user.department,
        )

        return new_user, access_token

    @staticmethod
    def register_user(
        db: Session,
        request,
    ) -> User:

        raise CredentialsException(
            "Direct registration is disabled. "
            "Please use OTP verification to create an account."
        )

    @staticmethod
    def authenticate_user(
        db: Session,
        request: LoginRequest,
    ) -> tuple[User, str]:

        email_clean = request.email.lower().strip()

        user = (
            db.query(User)
            .filter(User.email == email_clean)
            .first()
        )

        if not user:
            raise CredentialsException(
                "Invalid email or password."
            )

        try:
            password_valid = verify_password(
                request.password,
                user.hashed_password,
            )
        except Exception:
            password_valid = False

        if not password_valid:
            raise CredentialsException(
                "Invalid email or password."
            )

        if not user.is_active:
            raise CredentialsException(
                "User account is inactive."
            )

        if hasattr(user, "is_verified") and not user.is_verified:
            raise CredentialsException(
                "User account has not been verified."
            )

        token_data = {
            "sub": user.id,
            "email": user.email,
            "role": user.role_id,
            "department": user.department,
        }

        access_token = create_access_token(
            data=token_data
        )

        logger.info(
            "User authenticated | user_id=%s",
            user.id,
        )

        return user, access_token

    @staticmethod
    def send_phone_verification_otp(
        user: User,
        phone_number: str,
        department: str = "General",
        requested_role: str = "employee",
    ) -> dict:
        phone_clean = phone_number.strip()
        if len(phone_clean) < 10:
            raise CredentialsException("Invalid mobile phone number.")

        mobile_otp = str(secrets.randbelow(900000) + 100000)
        expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
        mobile_otp_hash = hash_password(mobile_otp)

        PHONE_OTP_SESSIONS[user.id] = {
            "phone_number": phone_clean,
            "department": department if department in ALLOWED_DEPARTMENTS else "General",
            "requested_role": requested_role.strip().lower() or "employee",
            "otp_hash": mobile_otp_hash,
            "expires_at": expires_at,
            "attempts": 0,
        }

        try:
            sms_sent = sms_service.send_mobile_otp(phone_clean, mobile_otp)
        except Exception as exc:
            PHONE_OTP_SESSIONS.pop(user.id, None)
            logger.exception("Failed to send phone verification OTP")
            raise CredentialsException("Unable to send SMS verification code.") from exc

        if not sms_sent:
            PHONE_OTP_SESSIONS.pop(user.id, None)
            raise CredentialsException("Unable to deliver SMS verification code. Please try again.")

        return {
            "message": f"Verification code sent to {phone_clean}.",
            "phone_number": phone_clean,
            "expires_in_minutes": OTP_EXPIRY_MINUTES,
        }

    @staticmethod
    def verify_phone_otp(
        db: Session,
        user: User,
        phone_number: str,
        otp: str,
    ) -> User:
        session_data = PHONE_OTP_SESSIONS.get(user.id)
        if not session_data:
            raise CredentialsException("No active phone verification session. Please request a new code.")

        if datetime.utcnow() > session_data["expires_at"]:
            PHONE_OTP_SESSIONS.pop(user.id, None)
            raise CredentialsException("Verification code has expired. Please request a new code.")

        if session_data.get("attempts", 0) >= MAX_OTP_ATTEMPTS:
            PHONE_OTP_SESSIONS.pop(user.id, None)
            raise CredentialsException("Too many invalid attempts. Please request a new code.")

        session_data["attempts"] = session_data.get("attempts", 0) + 1

        otp_clean = otp.strip()
        if not verify_password(otp_clean, session_data["otp_hash"]):
            raise CredentialsException("Invalid 6-digit verification code.")

        user.phone_number = session_data["phone_number"]
        dept = session_data.get("department")
        if dept and dept in ALLOWED_DEPARTMENTS:
            user.department = dept

        req_role = session_data.get("requested_role")
        if req_role:
            user.requested_role_id = req_role

        db.commit()
        db.refresh(user)

        PHONE_OTP_SESSIONS.pop(user.id, None)
        logger.info("Onboarding completed for user %s (Phone: %s, Dept: %s, RequestedRole: %s)", user.id, user.phone_number, user.department, user.requested_role_id)
        return user


PHONE_OTP_SESSIONS: dict[str, dict] = {}
auth_service = AuthService()
