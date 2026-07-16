// Assembles the deployable legacy game into ../dist/classic/ (override with OUT_DIR).
// Everything the game loads at runtime is copied; tooling files are not.
import { cp, mkdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

const legacyDir = resolve(import.meta.dir, "..");
const outDir = resolve(process.env.OUT_DIR || join(legacyDir, "../dist/classic"));

const INCLUDE = [
  "index.html",
  "css",
  
  "images",
  "img",
  "javascripts",
  "json",
  "plantillas",
  "png",
  "sounds",
  "stylesheets",
  "vendor",
  "vendor-static",
];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
for (const entry of INCLUDE) {
  await cp(join(legacyDir, entry), join(outDir, entry), { recursive: true });
}
console.log(`Legacy game built into ${outDir}`);
