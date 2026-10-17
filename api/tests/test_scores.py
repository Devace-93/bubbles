import pytest
from conftest import signup


def post_score(client, headers, score):
    return client.post("/scores", json={"score": score}, headers=headers)


def test_post_score_returns_row_and_best(client):
    headers = signup(client, "ana")
    res = post_score(client, headers, 1250)
    assert res.status_code == 201
    body = res.get_json()
    assert body["score"]["score"] == 1250
    assert set(body["score"]) == {"id", "score", "created_at"}
    assert body["best"] == 1250
    assert post_score(client, headers, 900).get_json()["best"] == 1250
    assert post_score(client, headers, 2000).get_json()["best"] == 2000


def test_post_score_requires_session(client):
    res = client.post("/scores", json={"score": 10})
    assert res.status_code == 401
    assert res.get_json() == {"error": "no_session"}


@pytest.mark.parametrize("score", [-1, 100_001, "1250", 12.5, True, None])
def test_post_score_rejects_bad_values(client, score):
    headers = signup(client, "ana")
    res = post_score(client, headers, score)
    assert res.status_code == 400
    assert res.get_json() == {"error": "invalid_score"}


def test_post_score_rate_limited_per_user(client):
    ana = signup(client, "ana")
    for _ in range(30):
        assert post_score(client, ana, 1).status_code == 201
    assert post_score(client, ana, 1).status_code == 429
    # another user has their own bucket
    assert post_score(client, signup(client, "bob"), 1).status_code == 201


def test_my_scores_newest_first(client):
    headers = signup(client, "ana")
    for s in (100, 300, 200):
        post_score(client, headers, s)
    res = client.get("/me/scores", headers=headers)
    assert res.status_code == 200
    assert [r["score"] for r in res.get_json()["scores"]] == [200, 300, 100]


def test_my_scores_only_mine(client):
    ana = signup(client, "ana")
    bob = signup(client, "bob")
    post_score(client, ana, 100)
    post_score(client, bob, 999)
    assert [r["score"] for r in client.get("/me/scores", headers=ana).get_json()["scores"]] == [100]


def test_top_is_best_per_user_ordered(client):
    ana = signup(client, "ana")
    bob = signup(client, "bob")
    cid = signup(client, "cid")
    for s in (500, 1500, 700):
        post_score(client, ana, s)
    post_score(client, bob, 1500)  # ties ana's best, but later → after ana
    post_score(client, cid, 2000)
    res = client.get("/scores/top")
    assert res.status_code == 200
    rows = res.get_json()["scores"]
    assert [(r["handle"], r["score"]) for r in rows] == [("cid", 2000), ("ana", 1500), ("bob", 1500)]
    assert set(rows[0]) == {"id", "score", "created_at", "handle", "avatar_url"}
    assert rows[0]["avatar_url"].startswith("http")


def test_top_limit(client):
    for i in range(12):
        post_score(client, signup(client, f"user{i:02d}"), i)
    assert len(client.get("/scores/top").get_json()["scores"]) == 10
    assert len(client.get("/scores/top?limit=3").get_json()["scores"]) == 3
    assert len(client.get("/scores/top?limit=100").get_json()["scores"]) == 12


@pytest.mark.parametrize("limit", ["0", "101", "abc", "-5"])
def test_top_rejects_bad_limit(client, limit):
    res = client.get(f"/scores/top?limit={limit}")
    assert res.status_code == 400
    assert res.get_json() == {"error": "invalid_limit"}


def test_top_empty(client):
    assert client.get("/scores/top").get_json() == {"scores": []}
