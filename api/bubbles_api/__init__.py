"""Bubbles API: leaderboard for the Bubbles game (identity by accounts.3m4.net).

`create_app` wires configuration, the database pool, CORS, rate limiting,
error handlers and the blueprints. Everything else lives in one module per
concern (see api/PLAN.md).
"""

from flask import Flask
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

from . import db
from .config import Settings, load_settings
from .errors import register_error_handlers
from .limiter import limiter
from .routes import health, me, scores

__version__ = "0.1.0"


def create_app(settings: Settings | None = None) -> Flask:
    """Build the Flask application.

    `settings` defaults to the environment (see config.py); tests pass their
    own so they can point at the test database.
    """
    app = Flask(__name__)
    app.config["SETTINGS"] = settings or load_settings()
    app.json.sort_keys = False

    # Railway terminates TLS and proxies to us: trust one hop of X-Forwarded-*
    # so rate limits see the client IP, not the proxy's.
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)  # type: ignore[method-assign]

    db.init_app(app)
    # The session is a cookie on .3m4.net, so browser calls carry credentials:
    # the allowlist must be explicit (no wildcard) and credentials enabled.
    CORS(
        app,
        origins=app.config["SETTINGS"].cors_origins,
        methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
        supports_credentials=True,
    )
    limiter.init_app(app)
    register_error_handlers(app)

    app.register_blueprint(health.bp)
    app.register_blueprint(me.bp)
    app.register_blueprint(scores.bp)
    return app
