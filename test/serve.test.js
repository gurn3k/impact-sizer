import { test } from "node:test";
import assert from "node:assert/strict";
import { join, sep } from "node:path";
import { resolvePath } from "../scripts/resolve-path.mjs";

const root = join(sep, "site");

test("finding 6: malformed escapes return null instead of throwing", () => {
  assert.equal(resolvePath(root, "/%E0"), null);
  assert.equal(resolvePath(root, "/%"), null);
});

test("hostile paths never resolve outside the root", () => {
  const hostile = ["/../secret", "/%2e%2e/%2e%2e/secret", "/..%2f..%2fsecret", "/..%5c..%5csecret", "/..\\..\\secret", "//etc/passwd", "/a%00b"];
  for (const u of hostile) {
    const f = resolvePath(root, u);
    assert.ok(f === null || f.startsWith(root + sep), `${u} -> ${f}`);
  }
  assert.equal(resolvePath(root, "/a%00b"), null);
});

test("normal paths resolve inside the root", () => {
  assert.equal(resolvePath(root, "/"), join(root, "index.html"));
  assert.equal(resolvePath(root, "/src/sizing.js"), join(root, "src", "sizing.js"));
});
