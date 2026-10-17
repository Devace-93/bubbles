"""Queries on the scores table."""

from psycopg import Connection

COLUMNS = "id, score, created_at"


def create(conn: Connection, user_id: int, score: int) -> dict:
    """Insert one score for `user_id` and return it."""
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO scores (user_id, score) VALUES (%s, %s) RETURNING {COLUMNS}",
            (user_id, score),
        )
        return cur.fetchone()


def best_for_user(conn: Connection, user_id: int) -> int | None:
    """The user's highest score, or None if they have none yet."""
    with conn.cursor() as cur:
        cur.execute("SELECT max(score) AS best FROM scores WHERE user_id = %s", (user_id,))
        return cur.fetchone()["best"]


def for_user(conn: Connection, user_id: int, limit: int) -> list[dict]:
    """The user's scores, newest first, at most `limit` rows."""
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT {COLUMNS} FROM scores WHERE user_id = %s ORDER BY created_at DESC, id DESC LIMIT %s",
            (user_id, limit),
        )
        return cur.fetchall()


def top(conn: Connection, limit: int) -> list[dict]:
    """Leaderboard: each user's best score, highest first, earliest wins ties.

    DISTINCT ON picks one row per user (their best, using the
    scores_user_best_idx index); the outer query orders those rows.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, score, created_at, handle, avatar_url FROM (
                SELECT DISTINCT ON (s.user_id) s.id, s.score, s.created_at, u.handle, u.avatar_url
                FROM scores s
                JOIN users u ON u.id = s.user_id
                ORDER BY s.user_id, s.score DESC, s.created_at ASC
            ) best
            ORDER BY score DESC, created_at ASC, id ASC
            LIMIT %s
            """,
            (limit,),
        )
        return cur.fetchall()
