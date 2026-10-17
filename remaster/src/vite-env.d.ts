/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Canonical site origin (no trailing slash). Defaulted in vite.config.ts. */
  readonly VITE_SITE_URL: string;
  /** 3m4 apps index site origin. Defaulted in vite.config.ts. */
  readonly VITE_INFO_URL: string;
  /** accounts.3m4.net origin: the session widget (session.js) and login pages. Defaulted in vite.config.ts. */
  readonly VITE_ACCOUNTS_URL: string;
  /** Bubbles API origin (api/): online scores for signed-in players. Defaulted in vite.config.ts. */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Locales with a complete announcer clip set in public/voices/ (vite.config.ts).
declare const __VOICED_LOCALES__: readonly string[];
