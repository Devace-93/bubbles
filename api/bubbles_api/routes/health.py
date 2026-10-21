"""GET /health — liveness for Railway; also pings the database."""

import psycopg
from flask import Blueprint, jsonify
from psycopg_pool import PoolTimeout

from .. import db
from ..errors import ApiError

bp = Blueprint("health", __name__)


@bp.get("/health")
def health():
    """200 {"status": "ok"} when the database answers, else 503 database_unavailable."""
    try:
        with db.connection() as conn, conn.cursor() as cur:
            cur.execute("SELECT 1")
    except (psycopg.Error, PoolTimeout):
        raise ApiError("database_unavailable", 503) from None
    return jsonify(status="ok")
