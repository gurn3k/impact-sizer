import { size, summarize, arithmetic, fmtMoney, parseField, copyWithTimeout, INPUTS } from "./src/sizing.js";

const $ = (id) => document.getElementById(id);
const fields = [...document.querySelectorAll("input[data-key]")];
const kindOf = Object.fromEntries(INPUTS.map((d) => [d.key, d.kind]));

function readInputs() {
  const inputs = {};
  for (const el of fields) {
    (inputs[el.dataset.key] ??= {})[el.dataset.s] = parseField(el.value, kindOf[el.dataset.key]);
  }
  return inputs;
}

function render() {
  const r = size(readInputs());
  const badFields = new Set(r.ok ? [] : r.errors.map((e) => e.field));
  for (const el of fields) el.toggleAttribute("aria-invalid", badFields.has(el.dataset.key));

  $("errors").hidden = r.ok;
  $("results").hidden = !r.ok;
  // Finding 7: a likely fraction-for-percentage mix-up warns but still shows the result.
  const warnings = r.ok ? r.warnings : [];
  $("warnings").hidden = warnings.length === 0;
  $("warning-list").replaceChildren(...warnings.map((w) => {
    const li = document.createElement("li");
    li.textContent = `${w.label}: ${w.message}`;
    return li;
  }));
  const list = $("error-list");
  list.replaceChildren(); // finding 5: don't leave stale errors in the DOM
  if (!r.ok) {
    list.replaceChildren(...r.errors.map((e) => {
      const li = document.createElement("li");
      li.textContent = `${e.label}: ${e.problems.join("; ")}.`;
      return li;
    }));
    return;
  }

  $("base").textContent = fmtMoney(r.base);
  $("low").textContent = fmtMoney(r.low);
  $("high").textContent = fmtMoney(r.high);
  $("base-math").textContent = "Base: " + arithmetic(r.steps.base);
  $("low-math").textContent = "Low: " + arithmetic(r.steps.low);
  $("high-math").textContent = "High: " + arithmetic(r.steps.high);
  $("summary").textContent = summarize(r);
  $("copied").textContent = "";
  renderSwings(r);
}

function renderSwings(r) {
  // One shared axis from 0 to the largest single-input high, so bars are to scale.
  const max = Math.max(...r.sensitivity.map((s) => s.atHigh), r.base) || 1;
  const pct = (v) => (v / max) * 100;
  const rows = r.sensitivity.map((s, i) => {
    const row = document.createElement("div");
    row.className = "swing" + (i === 0 && r.driver ? " driver" : "");
    const label = document.createElement("div");
    label.className = "swing-label";
    label.textContent = s.label + (i === 0 && r.driver ? " (biggest)" : "");
    const track = document.createElement("div");
    track.className = "track";
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.left = pct(s.atLow) + "%";
    bar.style.width = Math.max(pct(s.atHigh) - pct(s.atLow), 0.5) + "%";
    const mark = document.createElement("div");
    mark.className = "mark";
    mark.style.left = pct(r.base) + "%";
    track.append(bar, mark);
    const vals = document.createElement("div");
    vals.className = "swing-vals";
    vals.textContent = `${fmtMoney(s.atLow)} to ${fmtMoney(s.atHigh)} (swing ${fmtMoney(s.swing)})`;
    row.append(label, track, vals);
    return row;
  });
  $("swings").replaceChildren(...rows);
}

$("copy").addEventListener("click", async () => {
  const status = $("copied");
  status.textContent = "Copying...";
  try {
    await copyWithTimeout((t) => navigator.clipboard.writeText(t), $("summary").textContent);
    status.textContent = "Copied.";
  } catch {
    const range = document.createRange();
    range.selectNodeContents($("summary"));
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    status.textContent = "Couldn't copy automatically. The summary is selected: press Ctrl+C (Cmd+C on a Mac).";
  }
});

$("form").addEventListener("input", render);
$("form").addEventListener("submit", (e) => e.preventDefault());
render();
