import logging
from backend.config import settings

logger = logging.getLogger(__name__)


class SMSService:
    """
    Mobile SMS OTP Verification Service.
    Supports Twilio SMS provider and console logger fallback.
    """

    def send_mobile_otp(self, phone_number: str, otp_code: str) -> bool:
        """
        Sends a 6-digit OTP verification code to the mobile phone number.
        """
        message_body = f"Your NeroxaAI registration OTP code is: {otp_code}. Valid for 10 minutes."

        # If Twilio credentials are configured
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            try:
                from twilio.rest import Client
                client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                client.messages.create(
                    body=message_body,
                    from_=settings.TWILIO_PHONE_NUMBER,
                    to=phone_number,
                )
                logger.info("Successfully sent Twilio SMS OTP to %s", phone_number)
                return True
            except Exception as err:
                logger.error("Failed to send Twilio SMS to %s: %s", phone_number, str(err))
                print(f"\n[MOBILE SMS FALLBACK - OTP FOR {phone_number}]: {otp_code}\n")
                return False
        else:
            # Console logger fallback
            logger.info("SMS provider not configured. Logging Mobile OTP code: %s for %s", otp_code, phone_number)
            print(f"\n=======================================================")
            print(f"  MOBILE SMS [SIMULATED OTP FOR {phone_number}]: {otp_code}")
            print(f"=======================================================\n")
            return True


sms_service = SMSService()
