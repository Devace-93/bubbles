// Client for the Bubbles API (api/): online scores for signed-in players.
//
// Requests carry the shared 3m4 session cookie (`credentials: "include"`);
// the API verifies it against accounts.3m4.net. Anonymous play never needs
// the API: every call here fails soft (null / []) so a missing or offline
// backend changes nothing in the game.

const BASE = import.meta.env.VITE_API_URL.replace(/\/$/, "");
const TIMEOUT_MS = 6000;

export interface TopScore {
  id: number;
  score: number;
  created_at: string;
  handle: string;
  avatar_url: string | null;
}

export interface ScoreResult {
  score: { id: number; score: number; created_at: string };
  best: number;
}

// Why a submission did not land. `unverified` = signed in but the e-mail is
// not confirmed yet (the API answers 403 email_unverified).
export type SubmitOutcome =
  | { ok: true; result: ScoreResult }
  | { ok: false; reason: "anonymous" | "unverified" | "unavailable" };

async function request(path: string, init: RequestInit = {}): Promise<Response | null> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${BASE}${path}`, { credentials: "include", signal: ctl.signal, ...init });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// POST /scores. 401 (no/expired session) and 403 (unverified) are expected
// outcomes, not errors: the caller decides what to show.
export async function submitScore(score: number): Promise<SubmitOutcome> {
  const res = await request("/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ score }),
  });
  if (!res) return { ok: false, reason: "unavailable" };
  if (res.status === 201) return { ok: true, result: (await res.json()) as ScoreResult };
  if (res.status === 401) return { ok: false, reason: "anonymous" };
  if (res.status === 403) return { ok: false, reason: "unverified" };
  return { ok: false, reason: "unavailable" };
}

// GET /scores/top — the public leaderboard, or null when the API is unreachable.
export async function topScores(limit = 10): Promise<TopScore[] | null> {
  const res = await request(`/scores/top?limit=${limit}`);
  if (!res || !res.ok) return null;
  const body = (await res.json()) as { scores: TopScore[] };
  return body.scores;
}
