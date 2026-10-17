"""Session verification + just-in-time provisioning from accounts claims."""

from conftest import bearer, expired_token, foreign_token, identity, mint, signup

from bubbles_api import db, m4session


def test_me_without_session(client):
    res = client.get("/me")
    assert res.status_code == 401
    assert res.get_json() == {"error": "no_session"}
    assert client.get("/me", headers={"Authorization": "Basic abc"}).get_json() == {"error": "no_session"}


def test_me_with_garbage_token(client):
    res = client.get("/me", headers=bearer("not.a.jwt"))
    assert res.status_code == 401
    assert res.get_json() == {"error": "invalid_session"}


def test_me_with_token_signed_by_someone_else(client):
    res = client.get("/me", headers=bearer(foreign_token(identity())))
    assert res.get_json() == {"error": "invalid_session"}


def test_me_with_wrong_audience_or_issuer(client):
    assert client.get("/me", headers=bearer(mint(identity(), audience="other"))).get_json() == {"error": "invalid_session"}
    assert client.get("/me", headers=bearer(mint(identity(), issuer="http://evil.test"))).get_json() == {"error": "invalid_session"}


def test_me_with_expired_token(client):
    res = client.get("/me", headers=bearer(expired_token(identity())))
    assert res.status_code == 401
    assert res.get_json() == {"error": "session_expired"}


def test_me_with_unknown_kid(client):
    res = client.get("/me", headers=bearer(mint(identity(), kid="deadbeef")))
    assert res.get_json() == {"error": "invalid_session"}


def test_me_from_cookie(client):
    claims = identity("ana", name="Ana López")
    client.set_cookie(m4session.COOKIE_NAME, mint(claims))
    res = client.get("/me")
    assert res.status_code == 200
    user = res.get_json()["user"]
    assert set(user) == {"id", "handle", "name", "avatar_url", "email_verified", "created_at"}
    assert user["handle"] == "ana"
    assert user["name"] == "Ana López"
    assert user["email_verified"] is True
    assert user["avatar_url"] == claims["avatar_url"]
    assert user["created_at"].endswith("Z")


def test_me_from_bearer_header(client):
    assert client.get("/me", headers=signup(client, "bob")).get_json()["user"]["handle"] == "bob"


def test_same_identity_maps_to_one_row(client):
    claims = identity("ana")
    first = client.get("/me", headers=bearer(mint(claims))).get_json()["user"]
    second = client.get("/me", headers=bearer(mint(claims))).get_json()["user"]
    assert first["id"] == second["id"]
    with client.application.app_context(), db.connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT count(*) AS n FROM users")
        assert cur.fetchone()["n"] == 1


def test_profile_refreshes_from_claims(client):
    claims = identity("ana", name="Ana")
    before = client.get("/me", headers=bearer(mint(claims))).get_json()["user"]
    renamed = {**claims, "handle": "ana-renamed", "name": "Ana L.", "avatar_url": claims["avatar_url"].replace("v=0", "v=3")}
    after = client.get("/me", headers=bearer(mint(renamed))).get_json()["user"]
    assert after["id"] == before["id"]
    assert (after["handle"], after["name"]) == ("ana-renamed", "Ana L.")
    assert after["avatar_url"].endswith("v=3")


def test_stale_handle_is_parked_for_the_new_owner(client):
    old = identity("ana")
    client.get("/me", headers=bearer(mint(old)))
    # accounts moved "ana" to another identity; our cache still has it on `old`.
    new = identity("ana")
    res = client.get("/me", headers=bearer(mint(new)))
    assert res.status_code == 200
    assert res.get_json()["user"]["handle"] == "ana"
    with client.application.app_context(), db.connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT handle FROM users WHERE identity_id = %s", (old["sub"],))
        assert cur.fetchone()["handle"].startswith("~")
    # the old owner's next visit restores their real (new) handle
    back = client.get("/me", headers=bearer(mint({**old, "handle": "ana-old"}))).get_json()["user"]
    assert back["handle"] == "ana-old"


def test_unverified_can_read_but_not_write(client):
    headers = bearer(mint(identity("ana", verified=False)))
    me = client.get("/me", headers=headers)
    assert me.status_code == 200
    assert me.get_json()["user"]["email_verified"] is False
    res = client.post("/scores", json={"score": 10}, headers=headers)
    assert res.status_code == 403
    assert res.get_json() == {"error": "email_unverified"}


def test_cors_allows_credentials_for_allowlisted_origin(client):
    res = client.options(
        "/scores",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert res.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"
    assert res.headers.get("Access-Control-Allow-Credentials") == "true"
    other = client.get("/scores/top", headers={"Origin": "https://evil.example"})
    assert "Access-Control-Allow-Origin" not in other.headers
