def test_health_ok(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.get_json() == {"status": "ok"}


def test_unknown_route_is_json(client):
    res = client.get("/nope")
    assert res.status_code == 404
    assert res.get_json() == {"error": "not_found"}


def test_wrong_method_is_json(client):
    res = client.delete("/health")
    assert res.status_code == 405
    assert res.get_json() == {"error": "method_not_allowed"}


def test_cors_allows_configured_origin(client):
    res = client.get("/health", headers={"Origin": "http://localhost:5173"})
    assert res.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"


def test_cors_blocks_other_origins(client):
    res = client.get("/health", headers={"Origin": "https://evil.example"})
    assert "Access-Control-Allow-Origin" not in res.headers
