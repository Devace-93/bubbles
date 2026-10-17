"""POST /scores (signed in, verified e-mail) and GET /scores/top (public leaderboard)."""

from flask import Blueprint, g, jsonify, request

from .. import db, serialize, validation
from ..auth import require_auth, require_verified
from ..limiter import limiter, session_key
from ..queries import scores

bp = Blueprint("scores", __name__, url_prefix="/scores")


@bp.post("")
@limiter.limit("30 per minute", key_func=session_key)
@require_auth
@require_verified
def create():
    """Record a finished round for the signed-in player.

    Body {"score": int}. 201 {score, best} where best is the player's highest
    score after this one (so the client can announce an online record).
    Errors: invalid_json, invalid_score (400), no_session / session_expired /
    invalid_session (401), email_unverified (403), rate_limited (429).
    """
    body = validation.json_body()
    value = validation.score(body.get("score"))
    with db.connection() as conn:
        row = scores.create(conn, g.user["id"], value)
        best = scores.best_for_user(conn, g.user["id"])
    return jsonify(score=serialize.score(row), best=best), 201


@bp.get("/top")
def top():
    """200 {scores: [...]} — best score per player, highest first. ?limit= 1–100, default 10.

    Rows carry `handle` and `avatar_url` (the accounts profile). Errors: invalid_limit (400).
    """
    limit = validation.limit(request.args.get("limit"))
    with db.connection() as conn:
        rows = scores.top(conn, limit)
    return jsonify(scores=[serialize.score(r) for r in rows])
