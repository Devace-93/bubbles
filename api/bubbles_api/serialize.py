"""JSON shapes for API responses (see PLAN.md, "Shapes")."""

from datetime import UTC, datetime


def timestamp(value: datetime) -> str:
    """ISO 8601 in UTC with a trailing Z, e.g. 2026-09-02T23:00:00Z."""
    return value.astimezone(UTC).isoformat(timespec="seconds").replace("+00:00", "Z")


def user(row: dict) -> dict:
    """Public view of a users row: the cached accounts profile."""
    return {
        "id": row["id"],
        "handle": row["handle"],
        "name": row["name"],
        "avatar_url": row["avatar_url"],
        "email_verified": row["email_verified"],
        "created_at": timestamp(row["created_at"]),
    }


def score(row: dict) -> dict:
    """A scores row; adds `handle` + `avatar_url` when the row carries them (leaderboard)."""
    out = {"id": row["id"], "score": row["score"], "created_at": timestamp(row["created_at"])}
    if "handle" in row:
        out["handle"] = row["handle"]
        out["avatar_url"] = row.get("avatar_url")
    return out
