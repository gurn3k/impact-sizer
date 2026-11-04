import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { size, validate, summarize, arithmetic, fmtMoney, INPUTS } from "../src/sizing.js";

const fx = JSON.parse(readFileSync(new URL("../fixtures/worked-examples.json", import.meta.url), "utf8"));
const planted = fx.valid.find((v) => v.id === "planted-range");

// P1, P3, P4 against hand-computed answers
for (const ex of fx.valid) {
  test(`${ex.id}: low/base/high match hand-computed answers (P1)`, () => {
    const r = size(ex.inputs);
    assert.equal(r.ok, true);
    assert.equal(r.low, ex.expected.low);
    assert.equal(r.base, ex.expected.base);
    assert.equal(r.high, ex.expected.high);
  });
  test(`${ex.id}: low <= base <= high (P3)`, () => {
    const r = size(ex.inputs);
    assert.ok(r.low <= r.base && r.base <= r.high);
  });
  test(`${ex.id}: driver matches (P4)`, () => {
    assert.equal(size(ex.inputs).driver, ex.expected.driver);
  });
  if (ex.expected.sensitivity) {
    test(`${ex.id}: swings and ranking match hand-computed answers (P4)`, () => {
      const got = size(ex.inputs).sensitivity.map(({ key, atLow, atHigh, swing }) => ({ key, atLow, atHigh, swing }));
      assert.deepEqual(got, ex.expected.sensitivity);
    });
  }
}

// P5, P6: fail closed, naming each bad field
for (const bad of fx.invalid) {
  test(`invalid ${bad.id}: no result, names ${bad.errorFields.join(", ")} (P5/P6)`, () => {
    const inputs = { ...planted.inputs, ...bad.patch };
    const r = size(inputs);
    assert.equal(r.ok, false);
    assert.equal(r.base, undefined, "no number may leak out of a failed result");
    assert.deepEqual(r.errors.map((e) => e.field), bad.errorFields);
  });
}

test("missing inputs object fails closed and names all four fields (P5)", () => {
  assert.deepEqual(validate(undefined).map((e) => e.field), INPUTS.map((d) => d.key));
  assert.deepEqual(validate({}).map((e) => e.field), INPUTS.map((d) => d.key));
});

test("NaN and Infinity are rejected (P5)", () => {
  for (const v of [NaN, Infinity, -Infinity]) {
    const r = size({ ...planted.inputs, value: { low: v, base: 120, high: 140 } });
    assert.equal(r.ok, false);
  }
});

// P2: each arithmetic line holds the same values as the inputs
test("arithmetic line shows the inputs and the result (P2)", () => {
  const r = size(planted.inputs);
  assert.equal(arithmetic(r.steps.base), "200,000 × 10% × 5% × $120 = $120,000");
  assert.equal(arithmetic(r.steps.low), "150,000 × 5% × 2% × $100 = $15,000");
  assert.equal(arithmetic(r.steps.high), "250,000 × 15% × 8% × $140 = $420,000");
});

// P7: summary figures come from the result; never call the span likely
test("summary repeats the page's figures and names the driver (P7)", () => {
  const r = size(planted.inputs);
  const s = summarize(r);
  for (const n of [r.base, r.low, r.high, 48000, 192000]) assert.ok(s.includes(fmtMoney(n)), `missing ${fmtMoney(n)}`);
  assert.match(s, /Lift in value per user moves the result most/);
  assert.match(s, /worst\/best case, not a confidence interval/);
});

test("summary never calls the span likely or probable (P7)", () => {
  for (const ex of fx.valid) assert.doesNotMatch(summarize(size(ex.inputs)), /likely|probab/i);
});

test("summary for a failed result is empty (P5)", () => {
  assert.equal(summarize({ ok: false, errors: [] }), "");
});

// Property: random valid inputs always keep low <= base <= high and every swing >= 0
test("random valid inputs keep ordering and non-negative swings (P3/P4)", () => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 500; i++) {
    const inputs = {};
    for (const d of INPUTS) {
      const max = d.kind === "percent" ? d.max : 1e5;
      const vals = [rnd() * max, rnd() * max, rnd() * max].map((v) => Math.round(v * 100) / 100).sort((a, b) => a - b);
      inputs[d.key] = { low: vals[0], base: vals[1], high: vals[2] };
    }
    const r = size(inputs);
    if (!r.ok) continue; // too-large is allowed to fail closed
    assert.ok(r.low <= r.base && r.base <= r.high, JSON.stringify(inputs));
    for (const s of r.sensitivity) assert.ok(s.swing >= 0);
  }
});
