# 01. Core seam: `size(inputs)`

`src/sizing.js` exports `validate(inputs)` and `size(inputs)`. They are pure functions with no DOM access.

- `size` returns either `{ ok: false, errors }` or `{ ok: true, low, base, high, steps, sensitivity }`.
- Covers PRD P1, P3, P4, P5 and P6.
- Done when: the fixture tests in `test/` pass.

Status: Done
Comments: Results are rounded to the cent to remove float noise (0.05 × 20000 = 1000.0000000000001). Rounding happens once, at the end, so it never compounds.
