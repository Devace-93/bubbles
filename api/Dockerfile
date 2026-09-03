# Bubbles API. Two targets:
#   dev  — used by compose.yaml: dev deps, editable install, source bind-mounted
#   prod — the last stage, so Railway builds it by default: migrate + gunicorn
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install dependencies first so code changes do not invalidate this layer.
COPY pyproject.toml ./
COPY bubbles_api ./bubbles_api
RUN pip install .

# --- development / tests ----------------------------------------------------
FROM base AS dev
RUN pip install -e ".[dev]"
CMD ["sh", "-c", "python scripts/migrate.py && flask --app wsgi run --debug --host 0.0.0.0 --port ${PORT:-8000}"]

# --- production (Railway) ---------------------------------------------------
FROM base AS prod
COPY . .
EXPOSE 8000
# PORT is injected by Railway; 8000 is the local default.
CMD ["sh", "-c", "python scripts/migrate.py && exec gunicorn --bind 0.0.0.0:${PORT:-8000} --workers 2 --access-logfile - wsgi:app"]
