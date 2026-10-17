"""Queries on the users table.

A users row mirrors an identity from accounts.3m4.net: it exists so scores
have a local integer key to join on, and it caches the public profile
(handle, name, avatar) so the leaderboard needs no calls to accounts.
"""

from psycopg import Connection

PUBLIC_COLUMNS = "id, identity_id, handle, name, avatar_url, email_verified, created_at"


def upsert_from_claims(conn: Connection, claims: dict) -> dict:
    """Create the row for `claims["sub"]` on first sight, else refresh its profile.

    The handle is unique globally (accounts enforces it), but this cache can
    lag: if another row still holds the handle this identity now has, that
    row is parked under a placeholder (`~<id>`) and gets its real handle back
    on its owner's next request.
    """
    handle = claims["handle"]
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE users SET handle = '~' || id::text WHERE handle = %s AND identity_id <> %s",
            (handle, claims["sub"]),
        )
        cur.execute(
            f"""
            INSERT INTO users (identity_id, handle, name, avatar_url, email_verified)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (identity_id) DO UPDATE SET
                handle = EXCLUDED.handle,
                name = EXCLUDED.name,
                avatar_url = EXCLUDED.avatar_url,
                email_verified = EXCLUDED.email_verified
            RETURNING {PUBLIC_COLUMNS}
            """,
            (
                claims["sub"],
                handle,
                claims.get("name"),
                claims.get("avatar_url"),
                bool(claims.get("email_verified")),
            ),
        )
        return cur.fetchone()


def get_by_id(conn: Connection, user_id: int) -> dict | None:
    """Public columns of one user, or None."""
    with conn.cursor() as cur:
        cur.execute(f"SELECT {PUBLIC_COLUMNS} FROM users WHERE id = %s", (user_id,))
        return cur.fetchone()
