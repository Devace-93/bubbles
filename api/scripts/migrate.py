"""Apply pending SQL migrations from api/migrations/ in file-name order.

Usage: DATABASE_URL=postgresql://... python scripts/migrate.py

Each migration runs in its own transaction and is recorded in
schema_migrations, so re-running the script is a no-op. Migrations are plain
SQL files named NNN_description.sql; the file name is the version.
"""

import os
import sys
from pathlib import Path

import psycopg

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"

CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS schema_migrations (
    version    text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
)
"""


def applied_versions(conn: psycopg.Connection) -> set[str]:
    """Return the versions already recorded in schema_migrations."""
    with conn.cursor() as cur:
        cur.execute("SELECT version FROM schema_migrations")
        return {row[0] for row in cur.fetchall()}


def apply(conn: psycopg.Connection, path: Path) -> None:
    """Run one migration file and record its version, atomically."""
    with conn.transaction(), conn.cursor() as cur:
        cur.execute(path.read_text(encoding="utf-8"))
        cur.execute("INSERT INTO schema_migrations (version) VALUES (%s)", (path.name,))


def main() -> int:
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("DATABASE_URL is not set", file=sys.stderr)
        return 1

    files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    with psycopg.connect(url) as conn:
        with conn.transaction(), conn.cursor() as cur:
            cur.execute(CREATE_TABLE)
        done = applied_versions(conn)
        pending = [f for f in files if f.name not in done]
        for path in pending:
            apply(conn, path)
            print(f"applied  {path.name}")
    print(f"{len(pending)} applied, {len(files) - len(pending)} already applied")
    return 0


if __name__ == "__main__":
    sys.exit(main())
