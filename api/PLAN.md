# Bubbles API — design

Leaderboard backend for the Bubbles game. Small on purpose: a Flask app with
plain SQL, one Postgres database, deployed as a single Railway service. The
game keeps working without an account; the API only adds an online
leaderboard for players signed in with their **3m4 account**
(accounts.3m4.net — the identity service shared by every 3m4 app; its
`CONTRACT.md` is binding here). This API never sees a password: it verifies
the shared session and caches the public profile.

## Stack

| Concern        | Choice                                   |
|----------------|------------------------------------------|
| Runtime        | Python 3.12                              |
| Web            | Flask 3, served by gunicorn              |
| Database       | PostgreSQL (Railway), psycopg 3, no ORM  |
| Sessions       | accounts.3m4.net cookie / bearer (EdDSA JWT), verified with PyJWT against its JWKS |
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
│  ├─ auth.py                  # require_auth / require_verified on top of m4session
│  ├─ m4session.py             # vendored verifier from the accounts repo (JWKS cache, EdDSA)
│  ├─ validation.py            # score / limit rules
│  ├─ queries/                 # one module per table, one function per query
│  │  ├─ users.py
│  │  └─ scores.py
│  └─ routes/                  # one blueprint per resource
│     ├─ health.py
│     ├─ me.py
│     └─ scores.py
└─ tests/
   ├─ conftest.py              # app + database fixtures, minted sessions, stubbed JWKS
   ├─ test_session.py
   ├─ test_scores.py
   └─ test_health.py
```

Rules: short functions, one concern per module, a docstring on every route and
query helper, SQL written by hand with `%s` placeholders (never string
formatting), no business logic in routes beyond validation and orchestration.

## Data model

```sql
users                      -- a cached mirror of an accounts.3m4.net identity
  id             bigint identity PK
  identity_id    uuid UNIQUE          -- the JWT `sub`
  handle         citext UNIQUE        -- the global 3m4 handle (leaderboard name)
  name           text
  avatar_url     text
  email_verified boolean default false
  created_at     timestamptz default now()

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

`citext` keeps handles unique case-insensitively. Rows are created on a
player's first request from the session claims and refreshed on every request
(handle, name, avatar, verified flag); the format of a handle is accounts'
business, not ours. Migration `002_identity.sql` dropped the password column
and every pre-existing row (decision 2026-10-16: no real users yet).

## Endpoints

All bodies are JSON. Errors are `{"error": "<snake_case_code>"}` with the
HTTP status below. Authenticated routes read the `3m4_session` cookie
(sent automatically by the browser, `credentials: "include"`) or
`Authorization: Bearer <jwt>`. There is no login endpoint: the game sends the
player to `${ACCOUNTS_URL}/login?return_to=…` (through the session widget).

| Method | Path          | Auth            | Rate limit    | Success                          |
|--------|---------------|-----------------|---------------|----------------------------------|
| GET    | /health       | no              | none          | 200 `{"status":"ok"}` (pings DB) |
| GET    | /me           | session         | none          | 200 `{user}`                     |
| GET    | /me/scores    | session         | none          | 200 `{scores:[…]}` newest first, max 50 |
| POST   | /scores       | session, verified e-mail | 30/min/session | 201 `{score, best}`     |
| GET    | /scores/top   | no              | none          | 200 `{scores:[…]}`               |

Shapes:
- `user`: `{"id": 1, "handle": "ana", "name": "Ana López", "avatar_url": "https://accounts.3m4.net/avatars/<uuid>?v=3", "email_verified": true, "created_at": "2026-09-02T23:00:00Z"}`
- `score`: `{"id": 9, "score": 1250, "created_at": "…"}`
- `/scores/top` rows add `"handle"` and `"avatar_url"`; one row per user (their best score),
  ordered by score desc then earliest first; `?limit=` 1–100, default 10.
- `POST /scores` body `{"score": 1250}`; `best` in the response is the user's
  best score after this insert, so the client can show "new online record".

Error codes:
- 400 `invalid_json`, `invalid_score`, `invalid_limit`
- 401 `no_session` (nothing presented), `session_expired` (the browser should
  `POST ${ACCOUNTS_URL}/api/session/refresh` with credentials and retry once),
  `invalid_session` (bad signature / issuer / audience / unknown key)
- 403 `email_unverified` (POST /scores until the e-mail is confirmed)
- 404 `not_found`, 405 `method_not_allowed`, 429 `rate_limited`,
  500 `internal_error`, 503 `database_unavailable` (health only)

## Auth

- Identity is accounts.3m4.net. The browser holds its `3m4_session` cookie
  (`Domain=.3m4.net`, 15-minute EdDSA JWT) and a refresh cookie scoped to
  accounts; see the accounts repo's `CONTRACT.md`.
- `require_auth` (auth.py) reads the cookie or bearer, verifies it with the
  vendored `m4session.verify` (JWKS from
  `${ACCOUNTS_INTERNAL_URL}/.well-known/jwks.json`, cached 10 min, issuer
  `ACCOUNTS_URL`, audience `3m4`), then `users.upsert_from_claims` creates or
  refreshes the local row and exposes it as `g.user` (claims as `g.identity`).
  A stale handle held by another cached row is parked as `~<id>` so the
  rightful owner always gets it; the parked row heals on its owner's next
  request.
- `require_verified` gates `POST /scores` on the `email_verified` claim
  (403 `email_unverified`); `/me` works unverified so the client can show who
  is signed in.
- Never log tokens; request logging is gunicorn's access log only.

## Validation

- score: integer, 0–100000. The client is trusted (an arcade game has no
  server-side replay); the cap only blocks absurd values.
- limit: integer 1–100.

## CORS and rate limiting

- `CORS_ORIGINS` is a comma-separated allowlist, production value
  `https://bubbles.3m4.net`; local dev adds `http://localhost:5173` and
  `http://localhost:4323`. Credentials are allowed (the session is a cookie),
  which is why the list is explicit and never `*`. Only `Authorization` and
  `Content-Type` headers, methods GET/POST.
- flask-limiter keyed by client IP (`X-Forwarded-For` aware via ProxyFix,
  Railway sits behind a proxy) for anonymous routes, and by a SHA-256 of the
  presented session token for `POST /scores` (limits run before the user is
  loaded, and the raw token never becomes a storage key). Storage is
  in-memory: fine for one instance, documented as such.

## Configuration

Read once at startup from the environment (`config.py`), missing required
values abort the process:

| Variable       | Required | Notes                                        |
|----------------|----------|----------------------------------------------|
| DATABASE_URL   | yes      | Railway injects it; local: see .env.example  |
| CORS_ORIGINS   | yes      | comma-separated origins                      |
| ACCOUNTS_URL   | no       | identity service origin = JWT issuer (default `http://localhost:8085`; prod `https://accounts.3m4.net`) |
| ACCOUNTS_INTERNAL_URL | no | where this process fetches the JWKS (default = ACCOUNTS_URL; local compose `http://accounts-api-1:5000` over the `edge` network) |
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
session and truncates the tables before each test. Sessions are minted with
a throwaway Ed25519 key and the verifier's JWKS fetch is stubbed, so no
accounts instance is needed. Tests exercise the HTTP layer with Flask's test
client: session errors, cookie and bearer transport, just-in-time
provisioning and profile refresh, the unverified gate, CORS credentials,
score posting, leaderboard ordering and limits, rate limiting.

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
the plugin), `CORS_ORIGINS`, `ACCOUNTS_URL=https://accounts.3m4.net`.
Healthcheck `GET /health`.
Custom domain `api.bubbles.3m4.net` via a CNAME at Bluehost. The frontend
reads `VITE_API_URL` at build time.

## Out of scope (for now)

Anything about identity (that is accounts.3m4.net's job), anti-cheat, admin
tooling, per-country leaderboards.

## Checkpoints

1. This plan, `pyproject.toml`, Dockerfile (dev/prod targets), compose,
   `.env.example`, migration 001 and `scripts/migrate.py`.
2. Flask app: config, db, errors, auth, validation, queries, routes, tests.
3. Frontend: `remaster/src/api.ts` + `session.ts` (the accounts widget),
   leaderboard on the home, score submission from the end screen,
   `VITE_API_URL` / `VITE_ACCOUNTS_URL` wiring. (Done 2026-10-16, with the
   move to accounts.3m4.net replacing the local login.)
4. `DEPLOY.md`: Railway service, Postgres, variables, domain, Bluehost CNAME.
