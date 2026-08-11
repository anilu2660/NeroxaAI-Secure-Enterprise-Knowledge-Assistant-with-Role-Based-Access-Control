import logging
import random
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.models.user import User
from backend.auth.password import hash_password, verify_password
from backend.auth.jwt_handler import create_access_token
from backend.auth.schemas import RegisterRequest, LoginRequest, InitiateRegistrationRequest, VerifyOTPRequest
from backend.auth.email_service import email_service
from backend.auth.sms_service import sms_service
from backend.utils.exceptions import CredentialsException, DuplicateResourceException

logger = logging.getLogger(__name__)

# Temporary in-memory OTP storage for registration verification sessions
# session_token -> { data, email_otp, mobile_otp, expires_at }
OTP_SESSIONS: dict[str, dict] = {}


class AuthService:
    """
    Service for registration, credential verification, Gmail SMTP + Mobile SMS OTP, and JWT generation.
    """

    @staticmethod
    def initiate_registration(db: Session, request: InitiateRegistrationRequest) -> dict:
        """
        Initiates registration by generating 6-digit Email & Mobile OTPs,
        dispatching Email OTP via Gmail SMTP and Mobile OTP via SMS.
        """
        email_clean = request.email.lower().strip()
        existing_user = db.query(User).filter(User.email == email_clean).first()
        if existing_user:
            raise DuplicateResourceException(f"User with email '{request.email}' already exists.")

        # Generate 6-digit OTPs
        email_otp = f"{random.randint(100000, 999999)}"
        mobile_otp = f"{random.randint(100000, 999999)}"
        session_token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        OTP_SESSIONS[session_token] = {
            "email": email_clean,
            "password": request.password,
            "full_name": request.full_name,
            "phone_number": request.phone_number,
            "department": request.department,
            "email_otp": email_otp,
            "mobile_otp": mobile_otp,
            "expires_at": expires_at,
        }

        # Dispatch Gmail SMTP & Mobile SMS OTPs
        email_sent = email_service.send_email_otp(email_clean, request.full_name, email_otp)
        sms_sent = sms_service.send_mobile_otp(request.phone_number, mobile_otp)

        logger.info(
            "Initiated OTP registration for %s (session=%s, email_sent=%s, sms_sent=%s)",
            email_clean,
            session_token,
            email_sent,
            sms_sent,
        )

        return {
            "session_token": session_token,
            "email": email_clean,
            "phone_number": request.phone_number,
            "expires_in_minutes": 10,
            "message": f"Verification OTPs sent to {email_clean} and {request.phone_number}.",
        }

    @staticmethod
    def verify_otp_and_create_user(db: Session, request: VerifyOTPRequest) -> tuple[User, str]:
        """
        Verifies Email OTP & Mobile OTP. Upon successful verification,
        creates the active User in database and issues JWT access token.
        """
        session_data = OTP_SESSIONS.get(request.session_token)
        if not session_data:
            raise CredentialsException("Invalid or expired verification session. Please register again.")

        if datetime.utcnow() > session_data["expires_at"]:
            OTP_SESSIONS.pop(request.session_token, None)
            raise CredentialsException("Verification OTPs have expired. Please request a new code.")

        if request.email_otp.strip() != session_data["email_otp"]:
            raise CredentialsException("Invalid Email OTP code. Please check your inbox.")

        if request.mobile_otp.strip() != session_data["mobile_otp"]:
            raise CredentialsException("Invalid Mobile SMS OTP code. Please check your phone messages.")

        # Double check existing user
        email_clean = session_data["email"]
        existing_user = db.query(User).filter(User.email == email_clean).first()
        if existing_user:
            raise DuplicateResourceException(f"User with email '{email_clean}' is already registered.")

        # Create active verified User
        hashed_pwd = hash_password(session_data["password"])
        new_user = User(
            email=email_clean,
            hashed_password=hashed_pwd,
            full_name=session_data["full_name"],
            phone_number=session_data["phone_number"],
            department=session_data["department"],
            role_id="employee",
            is_active=True,
            is_verified=True,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Clear verified session
        OTP_SESSIONS.pop(request.session_token, None)

        # Generate JWT access token
        token_data = {
            "sub": new_user.id,
            "email": new_user.email,
            "role": new_user.role_id,
            "department": new_user.department,
        }
        access_token = create_access_token(data=token_data)

        logger.info("Successfully verified OTP and created user: %s (id=%s)", new_user.email, new_user.id)
        return new_user, access_token

    @staticmethod
    def register_user(db: Session, request: RegisterRequest) -> User:
        """
        Register a new user directly in the database.
        """
        existing_user = db.query(User).filter(User.email == request.email.lower()).first()
        if existing_user:
            raise DuplicateResourceException(f"User with email '{request.email}' already exists.")

        hashed_pwd = hash_password(request.password)

        new_user = User(
            email=request.email.lower(),
            hashed_password=hashed_pwd,
            full_name=request.full_name,
            department=request.department,
            role_id="employee",
            is_verified=True,
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
