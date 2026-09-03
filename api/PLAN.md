# Bubbles API — design

Accounts and leaderboard backend for the Bubbles game. Small on purpose: a
Flask app with plain SQL, one Postgres database, deployed as a single Railway
service. The game keeps working without an account; the API only adds
optional login and an online leaderboard.

## Stack

| Concern        | Choice                                   |
|----------------|------------------------------------------|
| Runtime        | Python 3.12                              |
| Web            | Flask 3, served by gunicorn              |
| Database       | PostgreSQL (Railway), psycopg 3, no ORM  |
| Passwords      | argon2id via argon2-cffi                 |
| Sessions       | JWT HS256 (PyJWT), 7-day expiry          |
| CORS           | flask-cors, explicit origin allowlist    |
| Rate limiting  | flask-limiter (in-memory per instance)   |
| Tests          | pytest against a real Postgres           |

## Layout

```
api/
├─ PLAN.md, DEPLOY.md          # this design; Railway + DNS guide (checkpoint 4)
├─ pyproject.toml              # deps, pytest and ruff config
├─ Dockerfile, railway.toml    # container + Railway build/healthcheck settings
├─ compose.yaml                # local Postgres (+ optional api container)
├─ .env.example                # every variable, documented
├─ migrations/NNN_*.sql        # plain SQL, applied in order
├─ scripts/migrate.py          # applies pending migrations, records them
├─ wsgi.py                     # gunicorn entry point: app = create_app()
├─ bubbles_api/
│  ├─ __init__.py              # create_app(): config, extensions, blueprints
│  ├─ config.py                # Settings read from the environment (fail fast)
│  ├─ db.py                    # connection pool, `connection()` context manager
│  ├─ errors.py                # ApiError + JSON error handlers
│  ├─ auth.py                  # hash/verify passwords, issue/read JWTs, require_auth
│  ├─ validation.py            # username / password / score rules
│  ├─ queries/                 # one module per table, one function per query
│  │  ├─ users.py
│  │  └─ scores.py
│  └─ routes/                  # one blueprint per resource
│     ├─ health.py
│     ├─ auth.py
│     ├─ me.py
│     └─ scores.py
└─ tests/
   ├─ conftest.py              # app + database fixtures, tables truncated per test
   ├─ test_auth.py
   ├─ test_scores.py
   └─ test_health.py
```

Rules: short functions, one concern per module, a docstring on every route and
query helper, SQL written by hand with `%s` placeholders (never string
formatting), no business logic in routes beyond validation and orchestration.

## Data model

```sql
users
  id            bigint identity PK
  username      citext UNIQUE, checked against ^[a-z0-9_]{3,20}$ (as text)
  password_hash text        -- argon2id string, includes its own salt/params
  created_at    timestamptz default now()

scores
  id          bigint identity PK
  user_id     bigint FK → users(id) ON DELETE CASCADE
  score       integer, 0 ≤ score ≤ 100000
  created_at  timestamptz default now()

schema_migrations
  version     text PK      -- migration file name, e.g. 001_users_scores.sql
  applied_at  timestamptz
```

Indexes:
- `scores (user_id, score DESC)` — best score per user, feeds the leaderboard.
- `scores (user_id, created_at DESC)` — a user's own history.

`citext` makes usernames unique case-insensitively (`Ana` and `ana` are the
same account); the API lowercases them anyway before storing.

## Endpoints

All bodies are JSON. Errors are `{"error": "<snake_case_code>"}` with the
HTTP status below. Authenticated routes read `Authorization: Bearer <jwt>`.

| Method | Path          | Auth | Rate limit | Success                          |
|--------|---------------|------|------------|----------------------------------|
| GET    | /health       | no   | none       | 200 `{"status":"ok"}` (pings DB) |
| POST   | /auth/register| no   | 5/min/IP   | 201 `{token, user}`              |
| POST   | /auth/login   | no   | 10/min/IP  | 200 `{token, user}`              |
| GET    | /me           | yes  | none       | 200 `{user}`                     |
| GET    | /me/scores    | yes  | none       | 200 `{scores:[…]}` newest first, max 50 |
| POST   | /scores       | yes  | 30/min/user| 201 `{score, best}`              |
| GET    | /scores/top   | no   | none       | 200 `{scores:[…]}`               |

Shapes:
- `user`: `{"id": 1, "username": "ana", "created_at": "2026-09-02T23:00:00Z"}`
- `score`: `{"id": 9, "score": 1250, "created_at": "…"}`
- `/scores/top` rows add `"username"`; one row per user (their best score),
  ordered by score desc then earliest first; `?limit=` 1–100, default 10.
- `POST /scores` body `{"score": 1250}`; `best` in the response is the user's
  best score after this insert, so the client can show "new online record".

Error codes:
- 400 `invalid_json`, `invalid_username`, `invalid_password`, `invalid_score`,
  `invalid_limit`
- 401 `missing_token`, `invalid_token`, `expired_token`, `invalid_credentials`
- 409 `username_taken`
- 404 `not_found`, 405 `method_not_allowed`, 429 `rate_limited`,
  500 `internal_error`

## Auth

- Register: validate, lowercase the username, hash with argon2id (library
  defaults), insert; a unique violation maps to `username_taken`. Returns a
  token immediately so registering also logs in.
- Login: fetch by username, verify the hash. Unknown user and wrong password
  both answer `invalid_credentials` (no user enumeration). A dummy verify runs
  when the user does not exist so timing is similar.
- Token: JWT HS256 signed with `JWT_SECRET`, claims `sub` (user id as string),
  `iat`, `exp` = 7 days. Sent by the client in `Authorization: Bearer`.
  `require_auth` decodes it and loads the user (a deleted user gets
  `invalid_token`).
- Never log tokens, passwords or hashes; request logging is gunicorn's access
  log only.

## Validation

- username: after lowercasing, `^[a-z0-9_]{3,20}$`.
- password: string, 8–128 characters (upper bound guards argon2 cost).
- score: integer, 0–100000. The client is trusted (an arcade game has no
  server-side replay); the cap only blocks absurd values.
- limit: integer 1–100.

## CORS and rate limiting

- `CORS_ORIGINS` is a comma-separated allowlist, production value
  `https://bubbles.3m4.net`; local dev adds `http://localhost:5173`.
  Only `Authorization` and `Content-Type` headers, methods GET/POST.
- flask-limiter keyed by client IP (`X-Forwarded-For` aware, Railway sits
  behind a proxy) for register/login and by user id for `POST /scores`.
  Storage is in-memory: fine for one instance, documented as such.

## Configuration

Read once at startup from the environment (`config.py`), missing required
values abort the process:

| Variable       | Required | Notes                                        |
|----------------|----------|----------------------------------------------|
| DATABASE_URL   | yes      | Railway injects it; local: see .env.example  |
| JWT_SECRET     | yes      | ≥ 32 random bytes, e.g. `python -c "import secrets;print(secrets.token_urlsafe(48))"` |
| CORS_ORIGINS   | yes      | comma-separated origins                      |
| PORT           | no       | gunicorn bind port, Railway sets it (default 8000) |
| TEST_DATABASE_URL | tests | separate database, truncated between tests   |

## Migrations

`scripts/migrate.py` connects with `DATABASE_URL`, creates
`schema_migrations` if missing, then applies every `migrations/*.sql` not yet
recorded, in file-name order, each in its own transaction. Re-running is a
no-op. The container runs it before starting gunicorn, so a Railway deploy
migrates itself.

## Testing

`pytest` runs inside the `test` compose service against the `bubbles_test`
database (`TEST_DATABASE_URL`). `conftest.py` applies the migrations once per
session and truncates the tables before each test. Tests exercise the HTTP
layer with Flask's test client: register/login/me flows, validation errors,
token errors, score posting, leaderboard ordering and limits, rate limiting.

## Local development

Everything runs in Docker; no Python on the host is needed.

```sh
cd api
docker compose up --build        # Postgres + API on http://localhost:8000
docker compose run --rm test     # pytest
docker compose run --rm api python scripts/migrate.py   # migrations only
docker compose down              # -v also drops the database volume
```

The `api` service uses the Dockerfile's `dev` target: dev dependencies, the
package installed editable and the source bind-mounted, so edits reload
without rebuilding. Rebuild only when `pyproject.toml` changes. Railway builds
the final `prod` target (migrate, then gunicorn).

## Deployment (summary, details in DEPLOY.md)

Railway project with a Postgres plugin and one service whose root directory
is `api/`, built from the Dockerfile. Variables: `DATABASE_URL` (reference to
the plugin), `JWT_SECRET`, `CORS_ORIGINS`. Healthcheck `GET /health`.
Custom domain `api.bubbles.3m4.net` via a CNAME at Bluehost. The frontend
reads `VITE_API_URL` at build time.

## Out of scope (for now)

Email, password reset, account deletion endpoint, refresh tokens, anti-cheat,
admin tooling, per-country leaderboards.

## Checkpoints

1. This plan, `pyproject.toml`, Dockerfile (dev/prod targets), compose,
   `.env.example`, migration 001 and `scripts/migrate.py`.
2. Flask app: config, db, errors, auth, validation, queries, routes, tests.
3. Frontend: `remaster/src/api.ts`, minimal login/register UI on the home,
   score submission from the end screen, `VITE_API_URL` wiring.
4. `DEPLOY.md`: Railway service, Postgres, variables, domain, Bluehost CNAME.
