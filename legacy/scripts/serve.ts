// Static dev server for the legacy game: bun run dev (from legacy/)
import { join, resolve } from "node:path";
import { existsSync } from "node:fs";

const root = resolve(import.meta.dir, "..");
const port = Number(process.env.PORT || 8015);

Bun.serve({
  port,
  fetch(req) {
    let path = decodeURIComponent(new URL(req.url).pathname);
    if (path.endsWith("/")) path += "index.html";
    const file = join(root, path);
    if (!file.startsWith(root) || !existsSync(file)) {
      return new Response("Not found", { status: 404 });
    }
    return new Response(Bun.file(file));
  },
});

console.log(`Legacy game running at http://localhost:${port}/`);
