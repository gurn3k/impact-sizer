// Syntax-checks every JavaScript file (ADR 0003: no linter or type checker without a dependency).
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const skip = new Set(["node_modules", ".git"]);
const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(m?js)$/.test(e.name)) files.push(p);
  }
})(".");

for (const f of files) execFileSync(process.execPath, ["--check", f], { stdio: "inherit" });
console.log(`check: ${files.length} files OK`);
