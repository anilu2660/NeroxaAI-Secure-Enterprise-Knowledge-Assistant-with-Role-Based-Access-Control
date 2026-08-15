import logging
from backend.config import settings
from backend.auth.password import verify_password

logger = logging.getLogger(__name__)


def _is_placeholder(val: str) -> bool:
    if not val:
        return True
    val_lower = val.strip().lower()
    return val_lower.startswith("your-") or val_lower.startswith("replace-") or "example" in val_lower


class SMSService:
    """
    Mobile SMS OTP Verification Service.
    Supports real Twilio Verify SMS delivery and console logger fallback.
    """

    def send_mobile_otp(self, phone_number: str, otp_code: str) -> bool:
        """
        Sends a 6-digit OTP verification code to the mobile phone number via Twilio SMS.
        """
        use_twilio = (
            settings.SMS_PROVIDER.strip().lower() == "twilio"
            and not _is_placeholder(settings.TWILIO_ACCOUNT_SID)
            and not _is_placeholder(settings.TWILIO_AUTH_TOKEN)
        )

        if use_twilio:
            try:
                from twilio.rest import Client
                client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

                # Use Twilio Verify API if configured
                verify_sid = settings.TWILIO_VERIFY_SERVICE_SID.strip()
                if verify_sid and not _is_placeholder(verify_sid):
                    verification = client.verify.v2.services(verify_sid).verifications.create(
                        to=phone_number,
                        channel="sms",
                    )
                    logger.info(
                        "Successfully dispatched Twilio Verify SMS to %s (SID: %s, Status: %s)",
                        phone_number,
                        verification.sid,
                        verification.status,
                    )
                    return True
                else:
                    # Standard Twilio SMS fallback
                    message_body = f"Your NeroxaAI registration OTP code is: {otp_code}. Valid for 10 minutes."
                    msg = client.messages.create(
                        body=message_body,
                        from_=settings.TWILIO_PHONE_NUMBER,
                        to=phone_number,
                    )
                    logger.info("Successfully sent Twilio SMS to %s (SID: %s)", phone_number, msg.sid)
                    return True
            except Exception as err:
                logger.error("Failed to send Twilio SMS to %s: %s", phone_number, str(err))
                return False
        else:
            # Console logger fallback for local dev when SMS_PROVIDER=console
            logger.info("SMS provider set to console. Logging Mobile OTP code: %s for %s", otp_code, phone_number)
            print(f"\n=======================================================")
            print(f"  MOBILE SMS [SIMULATED OTP FOR {phone_number}]: {otp_code}")
            print(f"=======================================================\n")
            return True

    def verify_mobile_otp(self, phone_number: str, mobile_otp: str, stored_hash: str) -> bool:
        """
        Verifies the user's submitted mobile OTP via Twilio Verify API or stored bcrypt hash.
        """
        # First check local hashed OTP
        try:
            if verify_password(mobile_otp, stored_hash):
                return True
        except Exception:
            pass

        # If using Twilio Verify API, check with Twilio
        use_twilio = (
            settings.SMS_PROVIDER.strip().lower() == "twilio"
            and not _is_placeholder(settings.TWILIO_ACCOUNT_SID)
            and not _is_placeholder(settings.TWILIO_AUTH_TOKEN)
        )
        verify_sid = settings.TWILIO_VERIFY_SERVICE_SID.strip()

        if use_twilio and verify_sid and not _is_placeholder(verify_sid):
            try:
                from twilio.rest import Client
                client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                check = client.verify.v2.services(verify_sid).verification_checks.create(
                    to=phone_number,
                    code=mobile_otp,
                )
                if check.status == "approved":
                    logger.info("Successfully verified Twilio SMS OTP for %s", phone_number)
                    return True
            except Exception as err:
                logger.error("Twilio Verify check failed for %s: %s", phone_number, str(err))

        return False


sms_service = SMSService()


