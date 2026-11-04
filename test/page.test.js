import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseField, size, INPUTS, SCENARIOS } from "../src/sizing.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const fx = JSON.parse(readFileSync(new URL("../fixtures/worked-examples.json", import.meta.url), "utf8"));
const planted = fx.valid.find((v) => v.id === "planted-range");

function prefilled() {
  const out = {};
  const re = /<input data-key="(\w+)" data-s="(\w+)"[^>]*value="([^"]*)"/g;
  for (const [, key, s, v] of html.matchAll(re)) (out[key] ??= {})[s] = parseField(v);
  return out;
}

test("page pre-fills exactly the hand-computed example (P8)", () => {
  assert.deepEqual(prefilled(), planted.inputs);
});

test("page has one input per input and scenario", () => {
  const p = prefilled();
  for (const d of INPUTS) for (const s of SCENARIOS) assert.ok(p[d.key]?.[s] !== undefined, `${d.key}.${s}`);
});

test("the example sentence on the page matches the base inputs (public claim)", () => {
  const b = size(planted.inputs).steps.base.values;
  assert.match(html, new RegExp(`for ${b.reach.toLocaleString("en-US")} users that ${b.adoption}% adopt, lifting their \\$${b.value} a year by ${b.lift}%`));
});

test("parseField accepts the forms people type", () => {
  assert.equal(parseField("200,000"), 200000);
  assert.equal(parseField(" $120 "), 120);
  assert.equal(parseField("10%"), 10);
  assert.equal(parseField("1e3"), 1000);
  assert.equal(parseField(""), null);
  assert.equal(parseField("   "), null);
});

test("parseField leaves junk as text so validation names it", () => {
  assert.equal(parseField("ten"), "ten");
  assert.equal(parseField("1.2.3"), "1.2.3");
  assert.equal(size({ ...planted.inputs, reach: { low: parseField("abc"), base: 1, high: 2 } }).ok, false);
});

test("page never inserts user text as HTML", () => {
  const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
  assert.doesNotMatch(app, /innerHTML|outerHTML|insertAdjacentHTML|document\.write/);
});

test("reader-facing copy has no em dashes and never calls the span likely", () => {
  const visible = html.replace(/<[^>]+>/g, " ");
  assert.doesNotMatch(visible, /—/);
  // The only allowed use of "likely" is the disclaimer "not a likely range".
  assert.doesNotMatch(visible.replace(/not a likely range/gi, ""), /likely|probab/i);
});
