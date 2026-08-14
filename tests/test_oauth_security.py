import time

import pytest

from backend.auth.oauth_service import oauth_service
from backend.config import settings
from backend.utils.exceptions import CredentialsException


def test_oauth_state_round_trip():
    provider = "google"
    redirect_uri = oauth_service.build_redirect_uri(provider)
    state = oauth_service.create_state(provider, redirect_uri)

    oauth_service.verify_state(state, provider, redirect_uri)


def test_oauth_state_rejects_tampering():
    provider = "google"
    redirect_uri = oauth_service.build_redirect_uri(provider)
    state = oauth_service.create_state(provider, redirect_uri)
    encoded, signature = state.split(".", 1)
    tampered = f"{encoded}x.{signature}"

    with pytest.raises(CredentialsException):
        oauth_service.verify_state(tampered, provider, redirect_uri)


def test_oauth_state_rejects_provider_mismatch():
    redirect_uri = oauth_service.build_redirect_uri("google")
    state = oauth_service.create_state("google", redirect_uri)

    with pytest.raises(CredentialsException):
        oauth_service.verify_state(state, "github", redirect_uri)


def test_oauth_state_rejects_redirect_uri_mismatch():
    state = oauth_service.create_state("google", oauth_service.build_redirect_uri("google"))

    with pytest.raises(CredentialsException):
        oauth_service.verify_state(state, "google", "https://attacker.example/callback")


def test_oauth_state_rejects_expired_state(monkeypatch):
    provider = "google"
    redirect_uri = oauth_service.build_redirect_uri(provider)
    original_time = time.time()
    state = oauth_service.create_state(provider, redirect_uri)

    monkeypatch.setattr(
        "backend.auth.oauth_service.time.time",
        lambda: original_time + settings.OAUTH_STATE_EXPIRE_SECONDS + 1,
    )

    with pytest.raises(CredentialsException):
        oauth_service.verify_state(state, provider, redirect_uri)


def test_unsupported_provider_is_rejected():
    with pytest.raises(CredentialsException):
        oauth_service.normalize_provider("apple")
