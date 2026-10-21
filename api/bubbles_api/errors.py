"""Error model: every failure is `{"error": "<snake_case_code>"}` with a status.

Raise `ApiError` anywhere in a request; the handlers below turn it (and
Flask's own HTTP errors, and unexpected exceptions) into that JSON shape.
"""

import logging

from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException

log = logging.getLogger(__name__)

HTTP_CODES = {
    400: "bad_request",
    404: "not_found",
    405: "method_not_allowed",
    415: "unsupported_media_type",
    429: "rate_limited",
}


class ApiError(Exception):
    """An expected failure with a machine-readable code and HTTP status."""

    def __init__(self, code: str, status: int):
        super().__init__(code)
        self.code = code
        self.status = status


def register_error_handlers(app: Flask) -> None:
    """Install the JSON error handlers on `app`."""

    @app.errorhandler(ApiError)
    def handle_api_error(err: ApiError):
        return jsonify(error=err.code), err.status

    @app.errorhandler(HTTPException)
    def handle_http_error(err: HTTPException):
        code = HTTP_CODES.get(err.code or 500) or err.name.lower().replace(" ", "_")
        return jsonify(error=code), err.code or 500

    @app.errorhandler(Exception)
    def handle_unexpected(err: Exception):
        # The traceback is enough context; never echo request bodies or headers.
        log.exception("unhandled error")
        return jsonify(error="internal_error"), 500
