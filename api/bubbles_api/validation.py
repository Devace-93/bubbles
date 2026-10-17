"""Input rules. Each function returns the cleaned value or raises ApiError 400."""

from flask import request

from .errors import ApiError

SCORE_MAX = 100_000
LIMIT_DEFAULT, LIMIT_MAX = 10, 100


def json_body() -> dict:
    """The request body as a JSON object, or ApiError invalid_json."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError("invalid_json", 400)
    return data


def score(value: object) -> int:
    """An integer (not a bool) between 0 and SCORE_MAX."""
    if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= SCORE_MAX:
        raise ApiError("invalid_score", 400)
    return value


def limit(value: str | None) -> int:
    """The `?limit=` query parameter: 1–LIMIT_MAX, default LIMIT_DEFAULT."""
    if value is None:
        return LIMIT_DEFAULT
    try:
        parsed = int(value)
    except ValueError:
        raise ApiError("invalid_limit", 400) from None
    if not 1 <= parsed <= LIMIT_MAX:
        raise ApiError("invalid_limit", 400)
    return parsed
