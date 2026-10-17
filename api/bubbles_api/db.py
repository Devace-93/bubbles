"""Database access: one psycopg connection pool per process.

Routes and query helpers use `connection()`:

    with db.connection() as conn:
        row = users.get_by_id(conn, 1)

The connection is returned to the pool on exit; the transaction is committed
if the block succeeds and rolled back if it raises.
"""

import atexit

from flask import Flask, current_app
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool


def init_app(app: Flask) -> None:
    """Open the pool for `app` and close it when the process exits."""
    pool = ConnectionPool(
        app.config["SETTINGS"].database_url,
        min_size=1,
        max_size=4,
        kwargs={"row_factory": dict_row},
        open=True,
    )
    app.extensions["db_pool"] = pool
    atexit.register(pool.close)


def connection():
    """Context manager yielding a pooled connection with dict rows."""
    return current_app.extensions["db_pool"].connection()
