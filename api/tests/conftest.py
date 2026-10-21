"""Fixtures: one app per session on the test database, clean tables per test.

Requires TEST_DATABASE_URL (the compose `test` service sets it). Migrations
are applied once; users/scores are truncated before every test and the rate
limiter's counters are reset so limits are tested in isolation.

Sessions are minted here with a throwaway Ed25519 key: the vendored verifier's
JWKS fetch is stubbed to return that key, so tests never talk to accounts.
"""

import base64
import hashlib
import os
import sys
import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from bubbles_api import create_app, db, m4session
from bubbles_api.config import Settings
from bubbles_api.limiter import limiter

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import migrate

ACCOUNTS_URL = "http://accounts.test"
AUDIENCE = "3m4"

_PRIVATE = Ed25519PrivateKey.generate()
_PUBLIC_RAW = _PRIVATE.public_key().public_bytes(
    serialization.Encoding.Raw, serialization.PublicFormat.Raw
)
KID = hashlib.sha256(_PUBLIC_RAW).hexdigest()[:8]
JWKS = {
    "keys": [
        {
            "kty": "OKP",
            "crv": "Ed25519",
            "kid": KID,
            "alg": "EdDSA",
            "use": "sig",
            "x": base64.urlsafe_b64encode(_PUBLIC_RAW).rstrip(b"=").decode(),
        }
    ]
}


class _FakeResponse:
    def __init__(self, payload):
        self._payload = payload

    def json(self):
        return self._payload


@pytest.fixture(scope="session", autouse=True)
def stub_jwks():
    """Serve the test JWKS to the verifier instead of fetching it over HTTP."""
    original = m4session.requests.get
    m4session.requests.get = lambda url, timeout=5: _FakeResponse(JWKS)
    m4session._cache._keys.clear()
    yield
    m4session.requests.get = original


@pytest.fixture(scope="session")
def app():
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.exit("TEST_DATABASE_URL is not set (run tests via `docker compose run --rm test`)")
    migrate.run(url)
    app = create_app(
        Settings(
            database_url=url,
            cors_origins=["http://localhost:5173"],
            accounts_url=ACCOUNTS_URL,
            accounts_internal_url=ACCOUNTS_URL,
        )
    )
    app.config["TESTING"] = True
    return app


@pytest.fixture(autouse=True)
def clean(app):
    with app.app_context(), db.connection() as conn, conn.cursor() as cur:
        cur.execute("TRUNCATE users, scores RESTART IDENTITY CASCADE")
    limiter.reset()


@pytest.fixture
def client(app):
    return app.test_client()


def identity(handle="ana", *, sub=None, name=None, verified=True, avatar=None) -> dict:
    """Claims for a fake accounts user; `sub` is random unless given."""
    sub = sub or str(uuid.uuid4())
    return {
        "sub": sub,
        "email": f"{handle}@example.com",
        "email_verified": verified,
        "handle": handle,
        "name": name,
        "avatar_url": avatar or f"{ACCOUNTS_URL}/avatars/{sub}?v=0",
    }


def mint(
    claims: dict,
    *,
    ttl=timedelta(minutes=15),
    issuer=ACCOUNTS_URL,
    audience=AUDIENCE,
    key=None,
    kid=KID,
) -> str:
    """Sign a session JWT the way accounts does (EdDSA, iss/aud/sid/iat/exp)."""
    now = datetime.now(UTC)
    payload = {
        "iss": issuer,
        "aud": audience,
        "sid": str(uuid.uuid4()),
        "iat": now,
        "exp": now + ttl,
        **claims,
    }
    return jwt.encode(payload, key or _PRIVATE, algorithm="EdDSA", headers={"kid": kid})


def bearer(token: str) -> dict:
    """Authorization header dict for `token`."""
    return {"Authorization": f"Bearer {token}"}


def signup(client, handle="ana", **kwargs) -> dict:
    """Headers for a fresh signed-in (verified) player with `handle`.

    Resets the rate limiter afterwards so tests can create many players.
    """
    headers = bearer(mint(identity(handle, **kwargs)))
    assert client.get("/me", headers=headers).status_code == 200
    limiter.reset()
    return headers


def expired_token(claims: dict) -> str:
    return mint(claims, ttl=timedelta(seconds=-120))


def foreign_token(claims: dict) -> str:
    """Signed by a key accounts never published (same kid, different key)."""
    return mint(claims, key=Ed25519PrivateKey.generate())
