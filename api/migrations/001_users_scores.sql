-- 001: accounts and scores.
-- citext makes usernames unique regardless of case; the check casts to text
-- so the format rule itself stays case-sensitive (lowercase only).
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username      citext NOT NULL UNIQUE,
    password_hash text NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT users_username_format CHECK (username::text ~ '^[a-z0-9_]{3,20}$')
);

CREATE TABLE scores (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    score      integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT scores_score_range CHECK (score BETWEEN 0 AND 100000)
);

-- Best score per user (leaderboard) and a user's own history (newest first).
CREATE INDEX scores_user_best_idx ON scores (user_id, score DESC);
CREATE INDEX scores_user_created_idx ON scores (user_id, created_at DESC);
