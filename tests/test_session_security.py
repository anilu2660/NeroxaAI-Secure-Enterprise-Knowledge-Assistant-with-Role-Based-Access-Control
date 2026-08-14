from backend.auth.routes import _set_access_token_cookie
from backend.config import settings


def test_access_token_cookie_is_httponly_and_samesite():
    from fastapi import Response

    response = Response()
    _set_access_token_cookie(response, "test-token")

    cookie = response.headers["set-cookie"].lower()
    assert "neroxa_access_token=test-token" in cookie
    assert "httponly" in cookie
    assert "samesite=lax" in cookie
    assert f"max-age={settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60}" in cookie
