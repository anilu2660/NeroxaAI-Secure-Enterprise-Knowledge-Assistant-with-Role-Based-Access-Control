"""
OAuth2 Authentication Service

Handles OAuth2 authorization flows, token exchange, user profile retrieval,
and account synchronization for social providers (Google, GitHub, Microsoft).
"""

import secrets
import logging
import httpx
from urllib.parse import urlencode
from sqlalchemy.orm import Session
from backend.config import settings
from backend.models.user import User
from backend.auth.password import hash_password
from backend.auth.jwt_handler import create_access_token
from backend.utils.exceptions import CredentialsException

logger = logging.getLogger(__name__)


class OAuthService:
    """Service handling OAuth2 social logins."""

    @staticmethod
    def get_provider_client_info(provider: str) -> tuple[str, str]:
        provider_lower = provider.lower()
        if provider_lower == "google":
            return settings.GOOGLE_CLIENT_ID, settings.GOOGLE_CLIENT_SECRET
        elif provider_lower == "github":
            return settings.GITHUB_CLIENT_ID, settings.GITHUB_CLIENT_SECRET
        elif provider_lower == "microsoft":
            return settings.MICROSOFT_CLIENT_ID, settings.MICROSOFT_CLIENT_SECRET
        else:
            raise CredentialsException(f"Unsupported OAuth provider '{provider}'.")

    @classmethod
    def get_authorization_url(cls, provider: str, redirect_uri: str) -> str:
        client_id, _ = cls.get_provider_client_info(provider)
        if not client_id:
            raise CredentialsException(
                f"OAuth configuration missing for {provider}. "
                f"Please set {provider.upper()}_CLIENT_ID in backend environment variables."
            )

        provider_lower = provider.lower()
        if provider_lower == "google":
            params = {
                "client_id": client_id,
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": "openid email profile",
                "access_type": "offline",
                "prompt": "select_account",
            }
            return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"

        elif provider_lower == "github":
            params = {
                "client_id": client_id,
                "redirect_uri": redirect_uri,
                "scope": "user:email read:user",
            }
            return f"https://github.com/login/oauth/authorize?{urlencode(params)}"

        elif provider_lower == "microsoft":
            tenant = getattr(settings, "MICROSOFT_TENANT_ID", "common") or "common"
            params = {
                "client_id": client_id,
                "response_type": "code",
                "redirect_uri": redirect_uri,
                "response_mode": "query",
                "scope": "openid email profile User.Read",
                "prompt": "select_account",
            }
            return f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize?{urlencode(params)}"

        raise CredentialsException(f"Unsupported provider '{provider}'.")

    @classmethod
    async def process_oauth_callback(
        cls,
        provider: str,
        code: str | None,
        redirect_uri: str,
        db: Session,
        id_token: str | None = None,
        user_json: str | None = None,
    ) -> tuple[User, str]:
        client_id, client_secret = cls.get_provider_client_info(provider)
        if not client_id or not client_secret:
            raise CredentialsException(f"OAuth credentials missing for {provider}.")

        provider_lower = provider.lower()
        email: str | None = None
        full_name: str | None = None

        async with httpx.AsyncClient(timeout=10.0) as client:
            if provider_lower == "google":
                # Exchange authorization code for token
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
                    logger.error("Google token exchange failed: %s", token_resp.text)
                    raise CredentialsException("Failed to exchange code with Google.")

                tokens = token_resp.json()
                access_token = tokens.get("access_token")

                # Get User Info
                user_resp = await client.get(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if user_resp.status_code != 200:
                    raise CredentialsException("Failed to retrieve user profile from Google.")

                profile = user_resp.json()
                email = profile.get("email")
                full_name = profile.get("name") or profile.get("given_name")

            elif provider_lower == "github":
                # Exchange authorization code for token
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
                    logger.error("GitHub token exchange failed: %s", token_resp.text)
                    raise CredentialsException("Failed to exchange code with GitHub.")

                tokens = token_resp.json()
                access_token = tokens.get("access_token")

                # Get User Profile
                user_resp = await client.get(
                    "https://api.github.com/user",
                    headers={
                        "Authorization": f"token {access_token}",
                        "User-Agent": "Enterprise-RAG-App",
                    },
                )
                if user_resp.status_code != 200:
                    raise CredentialsException("Failed to retrieve user profile from GitHub.")

                profile = user_resp.json()
                full_name = profile.get("name") or profile.get("login")
                email = profile.get("email")

                # If email is private in GitHub, fetch emails list
                if not email:
                    emails_resp = await client.get(
                        "https://api.github.com/user/emails",
                        headers={
                            "Authorization": f"token {access_token}",
                            "User-Agent": "Enterprise-RAG-App",
                        },
                    )
                    if emails_resp.status_code == 200:
                        emails_list = emails_resp.json()
                        primary_email = next(
                            (e["email"] for e in emails_list if e.get("primary") and e.get("verified")),
                            None,
                        )
                        email = primary_email or (emails_list[0]["email"] if emails_list else None)

            elif provider_lower == "microsoft":
                tenant = getattr(settings, "MICROSOFT_TENANT_ID", "common") or "common"
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
                    logger.error("Microsoft token exchange failed: %s", token_resp.text)
                    raise CredentialsException("Failed to exchange code with Microsoft.")

                tokens = token_resp.json()
                access_token = tokens.get("access_token")

                # Get Microsoft Graph User Profile
                user_resp = await client.get(
                    "https://graph.microsoft.com/v1.0/me",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if user_resp.status_code != 200:
                    raise CredentialsException("Failed to retrieve user profile from Microsoft.")

                profile = user_resp.json()
                email = profile.get("mail") or profile.get("userPrincipalName")
                full_name = profile.get("displayName") or profile.get("givenName")

            else:
                raise CredentialsException(f"OAuth flow for {provider} is not configured.")

        if not email:
            raise CredentialsException(f"Could not retrieve verified email address from {provider}.")

        email_clean = email.lower().strip()
        full_name_clean = full_name.strip() if full_name else email_clean.split("@")[0]

        # Find existing user or register
        user = db.query(User).filter(User.email == email_clean).first()
        if not user:
            random_pwd = secrets.token_urlsafe(24)
            hashed_pwd = hash_password(random_pwd)
            user = User(
                email=email_clean,
                hashed_password=hashed_pwd,
                full_name=full_name_clean,
                department="General",
                role_id="employee",
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info("Registered new user via %s OAuth: %s", provider, email_clean)

        if not user.is_active:
            raise CredentialsException("User account is inactive.")

        # Generate JWT token
        token_data = {
            "sub": user.id,
            "email": user.email,
            "role": user.role_id,
            "department": user.department,
        }
        app_token = create_access_token(data=token_data)
        return user, app_token


oauth_service = OAuthService()
