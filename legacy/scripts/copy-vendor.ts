// Copies the exact pinned library files from node_modules into legacy/vendor/,
// which is gitignored. index.html loads them from there.
// SoundJS 0.6.0 is NOT copied here: that version was never published to npm,
// so the original minified file is kept in legacy/vendor-static/ (committed).
import { mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const legacyDir = resolve(import.meta.dir, "..");
const rootModules = join(legacyDir, "node_modules");

const FILES: Array<[from: string, to: string]> = [
  ["jquery/jquery.min.js", "jquery.min.js"],
  ["gsap/src/minified/TweenLite.min.js", "gsap/TweenLite.min.js"],
  ["gsap/src/minified/TimelineLite.min.js", "gsap/TimelineLite.min.js"],
  ["gsap/src/minified/plugins/CSSPlugin.min.js", "gsap/plugins/CSSPlugin.min.js"],
  ["gsap/src/minified/easing/EasePack.min.js", "gsap/easing/EasePack.min.js"],
  ["@fontsource/luckiest-guy/files/luckiest-guy-latin-400-normal.woff2", "fonts/luckiest-guy-latin-400-normal.woff2"],
  ["@fontsource/luckiest-guy/files/luckiest-guy-latin-400-normal.woff", "fonts/luckiest-guy-latin-400-normal.woff"],
];

for (const [from, to] of FILES) {
  const src = join(rootModules, from);
  if (!existsSync(src)) {
    console.error(`Missing ${src} — run \`bun install\` first.`);
    process.exit(1);
  }
  const dest = join(legacyDir, "vendor", to);
  await mkdir(dirname(dest), { recursive: true });
  await copyFile(src, dest);
  console.log(`vendor/${to}`);
}
