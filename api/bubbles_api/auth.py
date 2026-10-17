"""Sessions come from accounts.3m4.net; this module only verifies them.

- The browser sends the `3m4_session` cookie (shared across *.3m4.net) or,
  for non-browser clients, `Authorization: Bearer <jwt>`.
- `require_auth` verifies the EdDSA JWT against the accounts JWKS (cached by
  the vendored `m4session`), provisions / refreshes the local users row from
  the claims and exposes it as `g.user` (claims as `g.identity`).
- `require_verified` additionally demands a verified e-mail (403
  `email_unverified`), which is what gates score submission.

Error codes keep this API's shape `{"error": "<code>"}`: `no_session`,
`session_expired`, `invalid_session` (401) and `email_unverified` (403).
"""

from functools import wraps

from flask import current_app, g, request

from . import db, m4session
from .errors import ApiError
from .queries import users


def _token() -> str | None:
    """The session JWT from the bearer header, else the cookie, else None."""
    # An explicit bearer header wins over the ambient cookie, so a client that
    # holds a cookie for one identity can still act as another on purpose.
    header = request.headers.get("Authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() == "bearer" and token.strip():
        return token.strip()
    return request.cookies.get(m4session.COOKIE_NAME) or None


def read_claims(token: str | None) -> dict:
    """Verify `token` and return its claims, or raise ApiError 401."""
    if not token:
        raise ApiError("no_session", 401)
    settings = current_app.config["SETTINGS"]
    try:
        return m4session.verify(
            token,
            jwks_url=f"{settings.accounts_internal_url}/.well-known/jwks.json",
            issuer=settings.accounts_url,
            audience=settings.audience,
        )
    except m4session.SessionError as err:
        raise ApiError(err.code, 401) from None


def require_auth(view):
    """Decorator: reject requests without a valid session, else set g.user / g.identity."""

    @wraps(view)
    def wrapper(*args, **kwargs):
        claims = read_claims(_token())
        with db.connection() as conn:
            user = users.upsert_from_claims(conn, claims)
        g.identity = claims
        g.user = user
        return view(*args, **kwargs)

    return wrapper


def require_verified(view):
    """Decorator (below require_auth): 403 email_unverified until the e-mail is confirmed."""

    @wraps(view)
    def wrapper(*args, **kwargs):
        if not g.user.get("email_verified"):
            raise ApiError("email_unverified", 403)
        return view(*args, **kwargs)

    return wrapper
