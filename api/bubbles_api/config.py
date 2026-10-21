"""Settings read from the environment, once, at startup.

Missing or unusable values raise immediately so a misconfigured deploy fails
at boot instead of on the first request.

Identity lives in accounts.3m4.net (see the accounts repo's CONTRACT.md):
this API only *verifies* its session cookie / bearer JWT, so there is no
secret of its own any more.
"""

import os
from collections.abc import Mapping
from dataclasses import dataclass

REQUIRED = ("DATABASE_URL", "CORS_ORIGINS")
DEFAULT_ACCOUNTS_URL = "http://localhost:8085"


@dataclass(frozen=True)
class Settings:
    database_url: str
    cors_origins: list[str]
    # Public origin of the identity service: the JWT issuer and where the
    # browser is sent to log in. https://accounts.3m4.net in production.
    accounts_url: str = DEFAULT_ACCOUNTS_URL
    # Where THIS process fetches the JWKS (same as accounts_url unless the
    # API runs next to accounts on a docker network: http://accounts-api-1:5000).
    accounts_internal_url: str = DEFAULT_ACCOUNTS_URL
    audience: str = "3m4"


def load_settings(env: Mapping[str, str] = os.environ) -> Settings:
    """Build Settings from `env`, validating the required variables."""
    missing = [name for name in REQUIRED if not env.get(name)]
    if missing:
        raise RuntimeError(f"missing environment variables: {', '.join(missing)}")
    origins = [o.strip() for o in env["CORS_ORIGINS"].split(",") if o.strip()]
    accounts_url = (env.get("ACCOUNTS_URL") or DEFAULT_ACCOUNTS_URL).rstrip("/")
    internal = (env.get("ACCOUNTS_INTERNAL_URL") or accounts_url).rstrip("/")
    return Settings(
        database_url=env["DATABASE_URL"],
        cors_origins=origins,
        accounts_url=accounts_url,
        accounts_internal_url=internal,
    )
