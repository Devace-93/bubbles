/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Canonical site origin (no trailing slash). Defaulted in vite.config.ts. */
  readonly VITE_SITE_URL: string;
  /** 3m4 apps index site origin. Defaulted in vite.config.ts. */
  readonly VITE_INFO_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
