// Regression tests for docs/FINDINGS.md. Each would have caught its finding.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseField, fmtMoney, copyWithTimeout, size, validate } from "../src/sizing.js";

test("finding 1: '0,5' is refused, not silently read as 5", () => {
  assert.equal(parseField("0,5"), "0,5");
  assert.equal(parseField("12,5"), "12,5");
  assert.equal(parseField("1,20"), "1,20");
  // real thousands separators still work
  assert.equal(parseField("1,200"), 1200);
  assert.equal(parseField("$1,234,567.5"), 1234567.5);
});

test("finding 2: non-decimal forms are refused", () => {
  for (const s of ["0x10", "0b11", "0o7", "Infinity", "1_000", "--5", "5-", ".", "e5", "١٢"]) {
    assert.equal(typeof parseField(s), "string", s);
  }
  assert.equal(parseField("+5"), 5);
  assert.equal(parseField("-3"), -3); // parsed, then refused by validation with a clear reason
  assert.equal(parseField(".5"), 0.5);
  assert.equal(parseField("5."), 5);
  assert.equal(parseField("10 %"), 10);
});

test("finding 1/2: a refused value fails closed and tells the user what to type", () => {
  const errs = validate({
    reach: { low: 1, base: 2, high: 3 }, adoption: { low: 1, base: parseField("0,5"), high: 3 },
    lift: { low: 1, base: 2, high: 3 }, value: { low: 1, base: 2, high: 3 },
  });
  assert.deepEqual(errs.map((e) => e.field), ["adoption"]);
  assert.match(errs[0].problems[0], /use digits, like 1,250\.5/);
});

test("finding 3: a clipboard write that never settles still settles the button", async () => {
  const never = () => new Promise(() => {});
  await assert.rejects(copyWithTimeout(never, "x", 50), /timeout/);
  await copyWithTimeout(async () => {}, "x", 50); // a working clipboard resolves
  await assert.rejects(copyWithTimeout(() => { throw new Error("denied"); }, "x", 50), /denied/);
});

test("finding 3: the page uses the timeout and falls back to selecting the text", () => {
  const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
  assert.match(app, /copyWithTimeout\(/);
  assert.match(app, /selectNodeContents\(\$\("summary"\)\)/);
});

test("finding 4: money with cents always shows two decimals", () => {
  assert.equal(fmtMoney(0.6), "$0.60");
  assert.equal(fmtMoney(1234.5), "$1,234.50");
  assert.equal(fmtMoney(120000), "$120,000");
  const r = size({ reach: { low: 1, base: 1, high: 1 }, adoption: { low: 10, base: 10, high: 10 },
    lift: { low: 5, base: 5, high: 5 }, value: { low: 120, base: 120, high: 120 } });
  assert.equal(fmtMoney(r.base), "$0.60");
});

test("finding 5: the error list is cleared on every render", () => {
  const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
  const render = app.slice(app.indexOf("function render()"), app.indexOf("function renderSwings"));
  assert.ok(render.indexOf("list.replaceChildren();") < render.indexOf("if (!r.ok)"));
});

// ---- Owner review, 2026-11-04 (findings 7 to 9) ----
import { arithmetic, warn } from "../src/sizing.js";

const streak = (lift) => ({
  reach: { low: 140_600_000, base: 150_000_000, high: 170_000_000 },
  adoption: { low: 3.6, base: 10, high: 15.6 },
  lift,
  value: { low: 8, base: 8.8, high: 9 },
});

test("finding 7: percentages typed as fractions warn, but the result still shows", () => {
  const r = size(streak({ low: 0.01, base: 0.017, high: 0.033 }));
  assert.equal(r.ok, true);
  assert.equal(r.warnings.length, 1);
  assert.equal(r.warnings[0].field, "lift");
  assert.match(r.warnings[0].message, /every value is under 1%/);
  assert.match(r.warnings[0].message, /If you meant 0\.01 to be 1%, type 1\./);
  // typed as percentages: no warning
  assert.deepEqual(size(streak({ low: 1, base: 1.7, high: 3.3 })).warnings, []);
  // a real small lift with any value at 1% or more: no warning
  assert.deepEqual(warn(streak({ low: 0.5, base: 1, high: 2 })), []);
  // all zero is a deliberate "no effect", not a typo
  assert.deepEqual(warn(streak({ low: 0, base: 0, high: 0 })), []);
  // the meant value never shows float noise (0.017 * 100 = 1.7000000000000002)
  assert.match(warn(streak({ low: 0, base: 0.017, high: 0.017 }))[0].message, /type 1\.7\.$/);
});

test("finding 7: the page shows warnings with textContent", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
  assert.match(html, /id="warnings"[^>]*hidden/);
  assert.match(html, /id="warning-list"/);
  assert.match(app, /li\.textContent = `\$\{w\.label\}: \$\{w\.message\}`/);
  assert.doesNotMatch(app, /innerHTML/);
});

test("finding 8: the written arithmetic keeps every decimal typed, so it multiplies out", () => {
  const r = size(streak({ low: 0.01, base: 0.017, high: 0.033 }));
  const line = arithmetic(r.steps.base);
  assert.equal(line, "150,000,000 × 10% × 0.017% × $8.80 = $22,440");
  // redo it from the text alone, the way a reviewer would
  const [lhs, rhs] = line.split(" = ");
  const nums = lhs.split(" × ").map((p) => Number(p.replace(/[$,]/g, "").replace("%", "")) / (p.endsWith("%") ? 100 : 1));
  const redone = Math.round(nums.reduce((a, b) => a * b, 1) * 100) / 100;
  assert.equal(fmtMoney(redone), rhs);
  // tiny and long decimals survive, ordinary values look the same as before
  assert.equal(arithmetic({ values: { reach: 200000, adoption: 10, lift: 5, value: 120 }, result: 120000 }), "200,000 × 10% × 5% × $120 = $120,000");
  assert.equal(arithmetic({ values: { reach: 1, adoption: 0.0000001, lift: 12.3456, value: 1 }, result: 0 }), "1 × 0.0000001% × 12.3456% × $1 = $0");
});

test("finding 9: a low above both base and high names both", () => {
  const problems = (adoption) => validate({ ...streak({ low: 1, base: 2, high: 3 }), adoption }).find((e) => e.field === "adoption")?.problems;
  assert.deepEqual(problems({ low: 20, base: 10, high: 15.6 }), ["low is above base and high"]);
  assert.deepEqual(problems({ low: 12, base: 10, high: 15 }), ["low is above base"]);
  assert.deepEqual(problems({ low: 5, base: 20, high: 3 }), ["low is above high", "base is above high"]);
  assert.equal(problems({ low: 3, base: 10, high: 15 }), undefined);
});

test("finding 10: a European thousands dot is refused out loud, never read as a decimal", () => {
  const base = { reach: { low: 1000, base: 1200, high: 1500 }, adoption: { low: 5, base: 10, high: 15 },
    lift: { low: 2, base: 5, high: 10 }, value: { low: 100, base: 120, high: 140 } };
  const problemsFor = (key, s, text) => {
    const def = { reach: "count", adoption: "percent", lift: "percent", value: "money" }[key];
    const inputs = structuredClone(base);
    inputs[key][s] = parseField(text, def);
    return validate(inputs).find((e) => e.field === key)?.problems ?? [];
  };
  // users: "1.200" parses as 1.2, which isn't a whole number of users
  assert.match(problemsFor("reach", "base", "1.200").join(), /base must be a whole number\. A dot is a decimal point here, so type thousands as 1,200 or 1200/);
  assert.equal(size({ ...base, reach: { low: 1000, base: parseField("1.200", "count"), high: 1500 } }).ok, false);
  // money: exactly three decimals is ambiguous, with or without "$"
  for (const t of ["1.200", "$1.200", "120.000"]) {
    assert.match(problemsFor("value", "base", t).join(), /is ambiguous: a dot is a decimal point here/, t);
  }
  assert.match(problemsFor("value", "base", "1.200").join(), /so 1\.200 would mean \$1\.20\./);
  // unambiguous forms still work
  assert.deepEqual(problemsFor("reach", "base", "1,200"), []);
  assert.deepEqual(problemsFor("value", "base", "120.50"), []);
  assert.deepEqual(problemsFor("value", "low", "0.125"), []);
  assert.deepEqual(problemsFor("value", "high", "1200"), []);
  // percentages keep three decimals: 1.234% is a real lift
  assert.deepEqual(problemsFor("lift", "low", "1.234"), []);
  // without a kind, parsing is unchanged
  assert.equal(parseField("1.200"), 1.2);
});

test("finding 10: the page passes each field's kind to the parser", () => {
  const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
  assert.match(app, /parseField\(el\.value, kindOf\[el\.dataset\.key\]\)/);
});
