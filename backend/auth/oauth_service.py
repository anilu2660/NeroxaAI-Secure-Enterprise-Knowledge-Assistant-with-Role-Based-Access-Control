"""
OAuth2 Authentication Service

Handles OAuth2 authorization flows, token exchange, user profile retrieval,
and account synchronization for social providers.
"""

import base64
import hashlib
import hmac
import json
import logging
import secrets
import time
from urllib.parse import urlencode

import httpx
from sqlalchemy.orm import Session

from backend.auth.jwt_handler import create_access_token
from backend.auth.password import hash_password
from backend.config import settings
from backend.models.user import User
from backend.utils.exceptions import CredentialsException

logger = logging.getLogger(__name__)


class OAuthService:
    SUPPORTED_PROVIDERS = {"google", "github", "microsoft"}

    @staticmethod
    def normalize_provider(provider: str) -> str:
        provider_lower = provider.strip().lower()
        if provider_lower not in OAuthService.SUPPORTED_PROVIDERS:
            raise CredentialsException("Unsupported OAuth provider.")
        return provider_lower

    @staticmethod
    def get_provider_client_info(provider: str) -> tuple[str, str]:
        provider_lower = OAuthService.normalize_provider(provider)

        if provider_lower == "google":
            return settings.GOOGLE_CLIENT_ID, settings.GOOGLE_CLIENT_SECRET
        if provider_lower == "github":
            return settings.GITHUB_CLIENT_ID, settings.GITHUB_CLIENT_SECRET
        if provider_lower == "microsoft":
            return settings.MICROSOFT_CLIENT_ID, settings.MICROSOFT_CLIENT_SECRET

        raise CredentialsException("Unsupported OAuth provider.")

    @staticmethod
    def build_redirect_uri(provider: str) -> str:
        provider_lower = OAuthService.normalize_provider(provider)
        return f"{settings.BACKEND_URL}/api/v1/auth/oauth/{provider_lower}/callback"

    @staticmethod
    def create_state(provider: str, redirect_uri: str, frontend_url: str | None = None) -> str:
        provider_lower = OAuthService.normalize_provider(provider)
        nonce = secrets.token_urlsafe(32)
        payload = {
            "provider": provider_lower,
            "redirect_uri": redirect_uri,
            "frontend_url": (frontend_url or settings.FRONTEND_URL).rstrip("/"),
            "nonce": nonce,
            "iat": int(time.time()),
        }
        encoded = base64.urlsafe_b64encode(
            json.dumps(payload, separators=(",", ":")).encode("utf-8")
        ).decode("ascii").rstrip("=")
        signature = hmac.new(
            settings.JWT_SECRET_KEY.encode("utf-8"),
            encoded.encode("ascii"),
            hashlib.sha256,
        ).digest()
        signature_encoded = base64.urlsafe_b64encode(signature).decode("ascii").rstrip("=")
        return f"{encoded}.{signature_encoded}"

    @staticmethod
    def verify_state(state: str, provider: str, expected_redirect_uri: str | None = None) -> dict:
        if not state or "." not in state:
            raise CredentialsException("Invalid OAuth state.")

        encoded, supplied_signature = state.split(".", 1)
        expected_signature = hmac.new(
            settings.JWT_SECRET_KEY.encode("utf-8"),
            encoded.encode("ascii"),
            hashlib.sha256,
        ).digest()
        expected_encoded = base64.urlsafe_b64encode(expected_signature).decode("ascii").rstrip("=")

        if not hmac.compare_digest(supplied_signature, expected_encoded):
            raise CredentialsException("Invalid OAuth state.")

        try:
            padded = encoded + "=" * (-len(encoded) % 4)
            payload = json.loads(
                base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8")
            )
        except (ValueError, UnicodeDecodeError, json.JSONDecodeError):
            raise CredentialsException("Invalid OAuth state.")

        issued_at = payload.get("iat")
        if not isinstance(issued_at, int):
            raise CredentialsException("Invalid OAuth state.")

        if time.time() - issued_at > settings.OAUTH_STATE_EXPIRE_SECONDS:
            raise CredentialsException("OAuth state has expired. Please try again.")

        if time.time() - issued_at < -30:
            raise CredentialsException("Invalid OAuth state.")

        if payload.get("provider") != OAuthService.normalize_provider(provider):
            raise CredentialsException("OAuth provider mismatch.")

        if expected_redirect_uri and payload.get("redirect_uri") and payload.get("redirect_uri") != expected_redirect_uri:
            logger.info("Redirect URI in payload (%s) differs slightly from derived (%s), using payload redirect URI", payload.get("redirect_uri"), expected_redirect_uri)

        return payload

    @classmethod
    def get_authorization_url(
        cls,
        provider: str,
        redirect_uri: str,
        state: str,
    ) -> str:
        client_id, _ = cls.get_provider_client_info(provider)
        if not client_id:
            raise CredentialsException("OAuth provider is not configured.")

        provider_lower = cls.normalize_provider(provider)

        if provider_lower == "google":
            params = {
                "client_id": client_id,
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": "openid email profile",
                "state": state,
                "access_type": "offline",
                "prompt": "select_account",
            }
            return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"

        if provider_lower == "github":
            params = {
                "client_id": client_id,
                "redirect_uri": redirect_uri,
                "scope": "user:email read:user",
                "state": state,
            }
            return f"https://github.com/login/oauth/authorize?{urlencode(params)}"

        tenant = settings.MICROSOFT_TENANT_ID or "common"
        params = {
            "client_id": client_id,
            "response_type": "code",
            "redirect_uri": redirect_uri,
            "response_mode": "query",
            "scope": "openid email profile User.Read",
            "state": state,
            "prompt": "select_account",
        }
        return f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize?{urlencode(params)}"

    @classmethod
    async def process_oauth_callback(
        cls,
        provider: str,
        code: str | None,
        redirect_uri: str,
        db: Session,
    ) -> tuple[User, str, bool]:
        provider_lower = cls.normalize_provider(provider)

        if not code or len(code) > 4096:
            raise CredentialsException("Invalid OAuth authorization code.")

        client_id, client_secret = cls.get_provider_client_info(provider_lower)
        if not client_id or not client_secret:
            raise CredentialsException("OAuth provider credentials are missing.")

        email: str | None = None
        full_name: str | None = None

        async with httpx.AsyncClient(
            timeout=httpx.Timeout(10.0, connect=5.0),
            follow_redirects=False,
        ) as client:
            if provider_lower == "google":
                token_resp = await client.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": redirect_uri,
                    },
                )
                if token_resp.status_code != 200:
                    logger.warning("Google OAuth token exchange failed with status %s: %s", token_resp.status_code, token_resp.text)
                    raise CredentialsException(f"Google authentication failed: {token_resp.text}")

                tokens = token_resp.json()
                access_token = tokens.get("access_token")
                if not access_token:
                    raise CredentialsException("Google authentication failed: No access token.")

                user_resp = await client.get(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if user_resp.status_code != 200:
                    logger.warning("Google UserInfo failed with status %s: %s", user_resp.status_code, user_resp.text)
                    raise CredentialsException("Google authentication failed to fetch profile.")

                profile = user_resp.json()
                if profile.get("verified_email") is not True:
                    raise CredentialsException("Google account email is not verified.")
                email = profile.get("email")
                full_name = profile.get("name") or profile.get("given_name")

            elif provider_lower == "github":
                token_resp = await client.post(
                    "https://github.com/login/oauth/access_token",
                    data={
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "code": code,
                        "redirect_uri": redirect_uri,
                    },
                    headers={"Accept": "application/json"},
                )
                if token_resp.status_code != 200:
                    logger.warning("GitHub OAuth token exchange failed with status %s", token_resp.status_code)
                    raise CredentialsException("GitHub authentication failed.")

                tokens = token_resp.json()
                access_token = tokens.get("access_token")
                if not access_token:
                    raise CredentialsException("GitHub authentication failed.")

                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "User-Agent": "NeroxaAI",
                    "Accept": "application/vnd.github+json",
                }

                user_resp = await client.get(
                    "https://api.github.com/user",
                    headers=headers,
                )
                if user_resp.status_code != 200:
                    raise CredentialsException("GitHub authentication failed.")

                profile = user_resp.json()
                full_name = profile.get("name") or profile.get("login")

                emails_resp = await client.get(
                    "https://api.github.com/user/emails",
                    headers=headers,
                )
                if emails_resp.status_code != 200:
                    raise CredentialsException("Could not verify GitHub email address.")

                emails_list = emails_resp.json()
                verified_emails = [
                    item.get("email")
                    for item in emails_list
                    if item.get("verified") is True and item.get("email")
                ]
                email = next(
                    (item.get("email") for item in emails_list if item.get("primary") is True and item.get("verified") is True),
                    None,
                ) or (verified_emails[0] if verified_emails else None)

            elif provider_lower == "microsoft":
                tenant = settings.MICROSOFT_TENANT_ID or "common"
                token_resp = await client.post(
                    f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
                    data={
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": redirect_uri,
                        "scope": "openid email profile User.Read",
                    },
                )
                if token_resp.status_code != 200:
                    logger.warning("Microsoft OAuth token exchange failed with status %s", token_resp.status_code)
                    raise CredentialsException("Microsoft authentication failed.")

                tokens = token_resp.json()
                access_token = tokens.get("access_token")
                if not access_token:
                    raise CredentialsException("Microsoft authentication failed.")

                user_resp = await client.get(
                    "https://graph.microsoft.com/v1.0/me",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if user_resp.status_code != 200:
                    raise CredentialsException("Microsoft authentication failed.")

                profile = user_resp.json()
                email = profile.get("mail") or profile.get("userPrincipalName")
                full_name = profile.get("displayName") or profile.get("givenName")

        if not email or "@" not in email:
            raise CredentialsException("Could not retrieve a verified email address.")

        email_clean = email.lower().strip()
        full_name_clean = full_name.strip() if full_name else email_clean.split("@", 1)[0]

        is_new_user = False
        user = db.query(User).filter(User.email == email_clean).first()
        if not user:
            is_new_user = True
            random_pwd = secrets.token_urlsafe(24)
            user = User(
                email=email_clean,
                hashed_password=hash_password(random_pwd),
                full_name=full_name_clean,
                department="General",
                role_id="employee",
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            if not user.is_active:
                raise CredentialsException("User account is inactive.")
            if hasattr(user, "is_verified") and not user.is_verified:
                raise CredentialsException("User account has not been verified.")

        token_data = {
            "sub": user.id,
            "email": user.email,
            "role": user.role_id,
            "department": user.department,
        }
        return user, create_access_token(data=token_data), is_new_user


oauth_service = OAuthService()
