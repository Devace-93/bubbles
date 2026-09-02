// Best score persisted per browser, used for the "new high score" announcement.

const KEY = "bubbles.highScore";

export function getHighScore(): number {
  const n = Number(localStorage.getItem(KEY));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// Records the score if it beats the stored best. Returns true when it did.
export function recordScore(score: number): boolean {
  if (score <= getHighScore()) return false;
  localStorage.setItem(KEY, String(score));
  return true;
}
