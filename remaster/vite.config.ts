import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

const here = import.meta.dirname;

// Default so no-env builds produce the canonical production URLs.
process.env.VITE_SITE_URL ??= "https://bubbles.3m4.net";
process.env.VITE_INFO_URL ??= "https://info.3m4.net";
// Identity (session widget + login pages) and the scores API. Local dev points
// at the accounts stack on :8085 and `docker compose up` in api/ on :8000.
process.env.VITE_ACCOUNTS_URL ??= "https://accounts.3m4.net";
process.env.VITE_API_URL ??= "https://api.bubbles.3m4.net";

// The remaster's visuals are original art (public/art/); only the legacy
// game's sound effects and font are reused. They are copied (not committed
// twice) into public/assets, which is gitignored.
function legacyAssets(): Plugin {
  return {
    name: "legacy-assets",
    config() {
      const legacy = resolve(here, "../legacy");
      const out = resolve(here, "public/assets");
      mkdirSync(out, { recursive: true });
      cpSync(resolve(legacy, "sounds"), resolve(out, "sounds"), { recursive: true });
    },
  };
}

// Locales whose four announcer clips all exist in public/voices/, exposed to
// the client as __VOICED_LOCALES__ so it never requests a missing clip.
function voicedLocales(): string[] {
  const dir = resolve(here, "public/voices");
  if (!existsSync(dir)) return [];
  const counts = new Map<string, number>();
  for (const f of readdirSync(dir)) {
    const m = /^[a-z-]+\.([A-Za-z-]+)\.mp3$/.exec(f);
    if (m) counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
  }
  return [...counts].filter(([, n]) => n === 4).map(([locale]) => locale).sort();
}

export default defineConfig({
  define: { __VOICED_LOCALES__: JSON.stringify(voicedLocales()) },
  base: "/",
  plugins: [legacyAssets()],
  build: {
    outDir: resolve(here, "../dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(here, "index.html"),
        play: resolve(here, "play/index.html"),
      },
    },
  },
});
