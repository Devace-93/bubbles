/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Canonical site origin (no trailing slash). Defaulted in vite.config.ts. */
  readonly VITE_SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
