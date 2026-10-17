"""Rate limiting shared by the blueprints.

In-memory storage: limits are per process, which is fine for a single
Railway instance. Move to a Redis `storage_uri` before scaling out.
"""

import hashlib

from flask import request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from .m4session import COOKIE_NAME

limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")


def session_key() -> str:
    """Limit key for authenticated routes: a hash of the presented session token.

    Limits are evaluated before the view runs, so the user is not loaded yet;
    hashing the token (cookie or bearer) keeps it out of the limiter's keys
    and still gives one bucket per session. Anonymous requests fall back to
    the client IP.
    """
    token = request.cookies.get(COOKIE_NAME) or request.headers.get("Authorization", "")
    if not token:
        return get_remote_address()
    return hashlib.sha256(token.encode()).hexdigest()
