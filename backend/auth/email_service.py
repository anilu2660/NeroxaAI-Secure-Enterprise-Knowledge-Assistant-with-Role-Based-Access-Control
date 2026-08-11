import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from backend.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """
    Gmail SMTP Email Service for user registration and OTP verification.
    """

    def send_email_otp(self, to_email: str, recipient_name: str, otp_code: str) -> bool:
        """
        Sends a 6-digit OTP verification code to the recipient via Gmail SMTP.
        """
        subject = f"🔐 Your NeroxaAI Registration Verification Code: {otp_code}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }}
            .container {{ max-width: 520px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }}
            .logo {{ font-size: 20px; font-weight: bold; color: #3b82f6; text-decoration: none; margin-bottom: 24px; display: inline-block; }}
            .title {{ font-size: 22px; font-weight: 600; color: #ffffff; margin-bottom: 8px; }}
            .text {{ font-size: 14px; color: #9ca3af; line-height: 1.6; margin-bottom: 24px; }}
            .otp-box {{ background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ffffff; text-align: center; padding: 18px; border-radius: 12px; margin: 24px 0; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4); }}
            .footer {{ font-size: 11px; color: #6b7280; text-align: center; border-top: 1px solid #1f2937; padding-top: 16px; margin-top: 32px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <a href="#" class="logo">⚡ NeroxaAI</a>
            <div class="title">Verify Your Email Address</div>
            <div class="text">Hello {recipient_name},<br/><br/>Welcome to NeroxaAI. Please enter the following 6-digit One-Time Password (OTP) to complete your account registration:</div>
            <div class="otp-box">{otp_code}</div>
            <div class="text">This code will expire in <strong>10 minutes</strong>. If you did not request this verification code, please ignore this email.</div>
            <div class="footer">NeroxaAI Enterprise Knowledge Assistant · Secure Retrieval-Augmented Generation</div>
          </div>
        </body>
        </html>
        """

        text_content = f"Hello {recipient_name},\n\nYour NeroxaAI registration OTP code is: {otp_code}\nThis code is valid for 10 minutes."

        # If Gmail SMTP user and password are set, send real email via smtplib
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
                msg["To"] = to_email

                msg.attach(MIMEText(text_content, "plain"))
                msg.attach(MIMEText(html_content, "html"))

                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                    server.starttls()
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())

                logger.info("Successfully sent Gmail SMTP OTP email to %s", to_email)
                return True
            except Exception as err:
                logger.error("Failed to send Gmail SMTP email to %s: %s", to_email, str(err))
                # Log fallback
                print(f"\n[GMAIL SMTP FALLBACK - EMAIL OTP FOR {to_email}]: {otp_code}\n")
                return False
        else:
            # Local development fallback
            logger.info("Gmail SMTP credentials not set. Logging OTP code: %s for %s", otp_code, to_email)
            print(f"\n=======================================================")
            print(f"  GMAIL SMTP [SIMULATED EMAIL OTP FOR {to_email}]: {otp_code}")
            print(f"=======================================================\n")
            return True


email_service = EmailService()
