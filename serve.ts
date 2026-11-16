// Lantern dev server: serves app/ as static files on http://localhost:8080.
// Usage: node serve.ts [--port 8080]. Node standard library only.

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = join(fileURLToPath(new URL(".", import.meta.url)), "app");
const args = process.argv.slice(2);
let port = 8080;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--port" && args[i + 1]) port = Number(args[i + 1]);
  else if (args[i].startsWith("--port=")) port = Number(args[i].slice(7));
}

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const server = createServer((req, res) => {
  const raw = decodeURIComponent((req.url || "/").split("?")[0]);
  const rel = raw === "/" ? "index.html" : raw.replace(/^\//, "");
  const path = normalize(join(appDir, rel));
  if (!path.startsWith(appDir + sep) && path !== appDir) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  if (!existsSync(path) || !statSync(path).isFile()) {
    res.writeHead(404);
    res.end("not found");
    return;
  }
  res.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream" });
  res.end(readFileSync(path));
});

server.listen(port, "127.0.0.1", () => {
  console.log("Lantern serving app/ on http://localhost:" + port);
});
