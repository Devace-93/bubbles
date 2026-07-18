import { cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

const here = import.meta.dirname;

// Default so no-env builds produce the canonical production URLs.
process.env.VITE_SITE_URL ??= "https://bubbles.3m4.net";

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

export default defineConfig({
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
