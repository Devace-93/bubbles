"""GET /me and GET /me/scores — the signed-in player's own data.

Both work with an unverified e-mail (the client uses /me to show who is
signed in); only writing scores requires verification.
"""

from flask import Blueprint, g, jsonify

from .. import db, serialize
from ..auth import require_auth
from ..queries import scores

bp = Blueprint("me", __name__, url_prefix="/me")

HISTORY_LIMIT = 50


@bp.get("")
@require_auth
def me():
    """200 {user} for the session's player. Errors: no_session, session_expired, invalid_session (401)."""
    return jsonify(user=serialize.user(g.user))


@bp.get("/scores")
@require_auth
def my_scores():
    """200 {scores: [...]} — the player's last HISTORY_LIMIT scores, newest first."""
    with db.connection() as conn:
        rows = scores.for_user(conn, g.user["id"], HISTORY_LIMIT)
    return jsonify(scores=[serialize.score(r) for r in rows])
