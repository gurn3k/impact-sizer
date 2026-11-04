import { join, normalize, sep } from "node:path";

// Maps a request URL to a file inside root, or null. Never throws (finding 6: a malformed
// %-escape used to throw outside the handler's try and crash the local server).
export function resolvePath(root, rawUrl) {
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(rawUrl, "http://x").pathname); } catch { return null; }
  if (urlPath.includes("\0")) return null;
  const file = normalize(join(root, urlPath === "/" ? "index.html" : urlPath));
  return file.startsWith(root + sep) ? file : null;
}
