// The shared 3m4 session, read through the accounts widget (session.js).
//
// The widget is loaded by a <script> tag in index.html / play/index.html and
// exposes window.m4session (see the accounts repo, CONTRACT.md). It may fail
// to load (offline, blocked) — every helper here degrades to "anonymous", so
// the game keeps working without an account.

export interface Player {
  handle: string;
  name: string | null;
  avatar_url: string;
  email_verified: boolean;
}

interface M4SessionUser {
  id: string;
  email: string;
  email_verified: boolean;
  handle: string;
  name: string | null;
  avatar_url: string;
}

interface M4Session {
  get(): Promise<M4SessionUser | null>;
  onChange(cb: (user: M4SessionUser | null) => void): () => void;
  login(returnTo?: string): void;
  signup(returnTo?: string): void;
  logout(): Promise<void> | void;
  profile(): void;
  origin: string;
}

declare global {
  interface Window {
    m4session?: M4Session;
  }
}

export const ACCOUNTS_URL = import.meta.env.VITE_ACCOUNTS_URL;

const WIDGET_WAIT_MS = 4000;

// Resolves once window.m4session exists (the widget script is deferred), or
// null if it never shows up within WIDGET_WAIT_MS.
function widget(): Promise<M4Session | null> {
  if (window.m4session) return Promise.resolve(window.m4session);
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = (): void => {
      if (window.m4session) return resolve(window.m4session);
      if (Date.now() - started > WIDGET_WAIT_MS) return resolve(null);
      setTimeout(tick, 50);
    };
    tick();
  });
}

function toPlayer(user: M4SessionUser | null): Player | null {
  if (!user) return null;
  return {
    handle: user.handle,
    name: user.name,
    avatar_url: user.avatar_url,
    email_verified: user.email_verified,
  };
}

// The signed-in player, or null when anonymous / the widget is unavailable.
export async function getPlayer(): Promise<Player | null> {
  try {
    const w = await widget();
    if (!w) return null;
    return toPlayer(await w.get());
  } catch {
    return null;
  }
}

// Calls `cb` now and whenever the session changes (login/logout in any tab).
export function onPlayerChange(cb: (player: Player | null) => void): void {
  widget().then((w) => {
    if (!w) return cb(null);
    try {
      w.onChange((user) => cb(toPlayer(user)));
    } catch {
      cb(null);
    }
  });
}

// Sends the visitor to the hosted login page and back here afterwards.
export function login(): void {
  if (window.m4session) window.m4session.login(location.href);
  else location.assign(`${ACCOUNTS_URL}/login?return_to=${encodeURIComponent(location.href)}`);
}
