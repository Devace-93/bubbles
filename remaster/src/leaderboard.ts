// Homepage leaderboard panel: top 10 online scores (avatar, @handle, score).
//
// Renders only when the API answers; anonymous visitors also get a hint to
// log in so their scores count. Re-rendered on language change and whenever
// the session changes.

import { topScores, type TopScore } from "./api";
import { t } from "./i18n";
import { getPlayer, login } from "./session";

let cached: TopScore[] | null | undefined; // undefined = not fetched yet

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function row(entry: TopScore, rank: number, me: string | null): string {
  const mine = me !== null && entry.handle === me ? " mine" : "";
  const avatar = entry.avatar_url
    ? `<img src="${esc(entry.avatar_url)}" alt="" width="28" height="28" loading="lazy" />`
    : `<span class="lb-avatar-fallback" aria-hidden="true"></span>`;
  return `<li class="lb-row${mine}">
    <span class="lb-rank">${rank}</span>
    ${avatar}
    <span class="lb-handle">@${esc(entry.handle)}</span>
    <span class="lb-score">${entry.score.toLocaleString()}</span>
  </li>`;
}

export async function mountLeaderboard(container: HTMLElement, { refresh = false } = {}): Promise<void> {
  if (cached === undefined || refresh) cached = await topScores(10);
  const s = t();
  if (cached === null) {
    // API unreachable: the section stays hidden, nothing else changes.
    container.hidden = true;
    return;
  }
  const player = await getPlayer();
  const me = player?.handle ?? null;
  const rows = cached.map((e, i) => row(e, i + 1, me)).join("");
  container.hidden = false;
  container.innerHTML = `
    <h2 class="lb-title">${esc(s.leaderboardTitle)}</h2>
    ${cached.length ? `<ol class="lb-list">${rows}</ol>` : `<p class="lb-empty">${esc(s.leaderboardEmpty)}</p>`}
    ${
      player
        ? player.email_verified
          ? ""
          : `<p class="lb-hint">${esc(s.verifyToSave)}</p>`
        : `<p class="lb-hint"><button type="button" class="lb-login">${esc(s.loginToSave)}</button></p>`
    }`;
  container.querySelector<HTMLButtonElement>(".lb-login")?.addEventListener("click", () => login());
}
