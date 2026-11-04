// Impact Sizer core. Pure functions, no DOM: shared by the page and the tests.
// Claim: every number can be redone by hand from the inputs on screen.

export const INPUTS = [
  { key: "reach", label: "Users reached", kind: "count" },
  { key: "adoption", label: "Share who use it", kind: "percent", max: 100 },
  { key: "lift", label: "Lift in value per user", kind: "percent", max: 1000 },
  { key: "value", label: "Value per user per year", kind: "money" },
];

export const SCENARIOS = ["low", "base", "high"];

// Largest result we can round to the cent exactly (MAX_SAFE_INTEGER / 100, rounded down).
export const RESULT_LIMIT = 90_000_000_000_000;

const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const factor = (def, v) => (def.kind === "percent" ? v / 100 : v);
const cents = (x) => Math.round(x * 100) / 100;

export function validate(inputs) {
  const errors = [];
  for (const def of INPUTS) {
    const row = inputs?.[def.key];
    const problems = [];
    for (const s of SCENARIOS) {
      const v = row?.[s];
      if (v === null || v === undefined || v === "") problems.push(`${s} is missing`);
      else if (typeof v === "string" && AMBIGUOUS_MONEY_RE.test(v.trim())) problems.push(`${s} is ambiguous: a dot is a decimal point here, so ${v.trim()} would mean ${AMBIGUOUS_AS_DECIMAL(v)}. Type 1,200 or 1200 for thousands, or two decimals like 1.20 for cents`);
      else if (!isNum(v)) problems.push(`${s} is not a number (use digits, like 1,250.5)`);
      else if (v < 0) problems.push(`${s} can't be negative`);
      // Finding 10: "1.200" (European for 1,200) parses as 1.2. A count of users is whole, so refuse it out loud.
      else if (def.kind === "count" && !Number.isInteger(v)) problems.push(`${s} must be a whole number. A dot is a decimal point here, so type thousands as 1,200 or 1200`);
      else if (def.max !== undefined && v > def.max) problems.push(`${s} can't be more than ${def.max}%`);
    }
    if (problems.length === 0) {
      // Finding 9: name every value the low sits above, not just the base.
      const lowAbove = [row.low > row.base && "base", row.low > row.high && "high"].filter(Boolean);
      if (lowAbove.length) problems.push(`low is above ${lowAbove.join(" and ")}`);
      if (row.base > row.high) problems.push("base is above high");
    }
    if (problems.length) errors.push({ field: def.key, label: def.label, problems });
  }
  return errors;
}

// Finding 7: "0.05" typed for 5% gives a result 100 times too small that still looks plausible.
// A percent row whose every value is under 1 (and not all zero) is probably a fraction typed as a
// percentage. It's only a warning: a real lift of 0.5% is valid, so the result still shows.
export function warn(inputs) {
  const warnings = [];
  for (const def of INPUTS) {
    if (def.kind !== "percent") continue;
    const vals = SCENARIOS.map((s) => inputs[def.key][s]);
    if (vals.every((v) => v < 1) && vals.some((v) => v > 0)) {
      const typed = vals.find((v) => v > 0);
      const meant = fmtPlain(Number((typed * 100).toPrecision(12))); // 0.017 * 100 is 1.7000000000000002
      warnings.push({
        field: def.key,
        label: def.label,
        message: `every value is under 1%. If you meant ${fmtPlain(typed)} to be ${meant}%, type ${meant}.`,
      });
    }
  }
  return warnings;
}

function product(values) {
  // values: { reach, adoption, lift, value } as entered.
  let x = 1;
  for (const def of INPUTS) x *= factor(def, values[def.key]);
  return x;
}

function pick(inputs, scenario) {
  const out = {};
  for (const def of INPUTS) out[def.key] = inputs[def.key][scenario];
  return out;
}

export function size(inputs) {
  const errors = validate(inputs);
  if (errors.length) return { ok: false, errors };

  const raw = {};
  for (const s of SCENARIOS) raw[s] = product(pick(inputs, s));
  // Every sensitivity value lies between low and high, so checking high covers them.
  if (raw.high > RESULT_LIMIT) {
    return {
      ok: false,
      errors: [{ field: "result", label: "Result", problems: [`the high estimate is above ${fmtPlain(RESULT_LIMIT)}, too large to show to the cent`] }],
    };
  }

  const steps = {};
  for (const s of SCENARIOS) steps[s] = { values: pick(inputs, s), result: cents(raw[s]) };

  const base = pick(inputs, "base");
  const sensitivity = INPUTS.map((def, order) => {
    const atLow = cents(product({ ...base, [def.key]: inputs[def.key].low }));
    const atHigh = cents(product({ ...base, [def.key]: inputs[def.key].high }));
    return { key: def.key, label: def.label, atLow, atHigh, swing: cents(atHigh - atLow), order };
  }).sort((a, b) => b.swing - a.swing || a.order - b.order);

  const driver = sensitivity[0].swing > 0 ? sensitivity[0].key : null;

  return {
    ok: true,
    warnings: warn(inputs),
    low: steps.low.result,
    base: steps.base.result,
    high: steps.high.result,
    steps,
    sensitivity: sensitivity.map(({ order, ...rest }) => rest),
    driver,
  };
}

// ---- Parsing what the user typed ----
// "1,000", "$120", "10%", "1e6" -> number; blank -> null; anything else stays a string so validation names it.
// Commas count only as thousands separators in the right places, so "0,5" is refused rather than read as 5
// (finding 1), and only decimal digits are accepted, so "0x10" is refused rather than read as 16 (finding 2).
const NUMBER_RE = /^([+-]?)((?:\d{1,3}(?:,\d{3})+|\d+)?(?:\.\d*)?)([eE][+-]?\d+)?$/;
// Finding 10: "$1.200" is $1,200 to a European reader and $1.20 to an American one. Money is
// never typed with exactly three decimals, so that shape is refused rather than guessed.
// A leading 0 ("0.125") can't be a thousands group, so it stays a plain decimal.
const AMBIGUOUS_MONEY_RE = /^\$?\s*[1-9]\d{0,2}\.\d{3}$/;
const AMBIGUOUS_AS_DECIMAL = (text) => fmtMoney(Number(String(text).trim().replace(/^\$\s*/, "")));

// `kind` is the input's kind from INPUTS. Only money needs it, for the ambiguity check above.
export function parseField(text, kind) {
  const t = String(text).trim().replace(/^\$\s*/, "").replace(/\s*%$/, "");
  if (t === "") return null;
  if (kind === "money" && AMBIGUOUS_MONEY_RE.test(String(text).trim())) return String(text);
  const m = t.match(NUMBER_RE);
  if (!m || !/\d/.test(m[2])) return String(text);
  const n = Number(m[1] + m[2].replace(/,/g, "") + (m[3] ?? ""));
  return Number.isFinite(n) ? n : String(text);
}

// ---- Formatting (also used by tests, so the page and tests agree) ----

// Finding 8: inputs are shown with every decimal place the user typed. Rounding 0.017 to "0.02"
// made the written arithmetic multiply out to a different answer from the one on the page.
function decimalPlaces(n) {
  const [mantissa, exp] = String(Math.abs(n)).split("e");
  const frac = (mantissa.split(".")[1] ?? "").length;
  return Math.min(20, Math.max(0, frac - Number(exp ?? 0)));
}

function fmtPlain(n) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: decimalPlaces(n) }).format(n);
}

// Whole amounts show no cents; anything else shows exactly two ("$0.60", not "$0.6": finding 4).
export function fmtMoney(n) {
  const whole = Number.isInteger(n);
  return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(n);
}

// Clipboard writes can hang (finding 3). Settle within `ms` either way, so the page always says something.
export function copyWithTimeout(write, text, ms = 1500) {
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("timeout")), ms); });
  return Promise.race([Promise.resolve().then(() => write(text)), timeout]).finally(() => clearTimeout(timer));
}

export function fmtInput(def, v) {
  if (def.kind === "percent") return fmtPlain(v) + "%";
  if (def.kind === "money") return fmtMoney(v);
  return fmtPlain(v);
}

// "200,000 × 10% × 5% × $120 = $120,000"
export function arithmetic(step) {
  const parts = INPUTS.map((def) => fmtInput(def, step.values[def.key]));
  return `${parts.join(" × ")} = ${fmtMoney(step.result)}`;
}

export function summarize(result) {
  if (!result.ok) return "";
  const lines = [
    `Estimated annual impact: ${fmtMoney(result.base)} (${arithmetic(result.steps.base)}).`,
    `If every input sits at its low or high end, the result runs from ${fmtMoney(result.low)} to ${fmtMoney(result.high)}. This is a worst/best case, not a confidence interval.`,
  ];
  if (result.driver) {
    const d = result.sensitivity[0];
    lines.push(`${d.label} moves the result most (${fmtMoney(d.atLow)} to ${fmtMoney(d.atHigh)} with the other inputs at base), so it is the assumption to check first.`);
  } else {
    lines.push("No input has a range, so there is no span to explain.");
  }
  return lines.join(" ");
}
