-- 002: identity moves to accounts.3m4.net.
-- Users are mirrors of an accounts identity (uuid `sub` claim) with a cached
-- public profile. Local passwords go away. Existing rows are dropped on
-- purpose (decision 2026-10-16: no real users yet, nothing to migrate).
TRUNCATE scores, users RESTART IDENTITY CASCADE;

ALTER TABLE users DROP CONSTRAINT users_username_format;
ALTER TABLE users DROP COLUMN password_hash;
ALTER TABLE users RENAME COLUMN username TO handle;
ALTER TABLE users
    ADD COLUMN identity_id    uuid    NOT NULL UNIQUE,
    ADD COLUMN name           text,
    ADD COLUMN avatar_url     text,
    ADD COLUMN email_verified boolean NOT NULL DEFAULT false;
-- `handle` stays citext + UNIQUE: accounts validates its format, this is a cache.
