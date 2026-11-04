// Local static server. ES modules don't load from file://, so the page needs one to run locally.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { resolvePath } from "./resolve-path.mjs";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT) || 4318;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };

createServer(async (req, res) => {
  const file = resolvePath(ROOT, req.url);
  if (!file) { res.writeHead(400).end("Bad request"); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(PORT, "127.0.0.1", () => console.log(`Impact Sizer on http://127.0.0.1:${PORT}`));
