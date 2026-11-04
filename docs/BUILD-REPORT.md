# Build report

2026-11-03, one session.

## Tickets
| # | Ticket | Status |
|---|---|---|
| 01 | Core seam `size()` | Done, fixture tests pass |
| 02 | Summary paragraph | Done |
| 03 | Page | Done, checked in Chrome through the DOM |
| 04 | Copy audit | Done: no em dashes, the span is never called likely, no build-or-don't advice. Tested in `test/page.test.js` |

## Finished means
| Command | Result |
|---|---|
| `npm test` | 44 of 44 pass |
| `npm run check` | 9 files OK |
| `npm start` and load the page | Shows $120,000 with the arithmetic, the swings and the summary |

## Live run
The first run in Chrome matched every hand-computed figure in `fixtures/worked-examples.json`. The adversarial pass found six problems, all fixed with tests (`docs/FINDINGS.md`).

## Decisions made without the owner
- **Formula shape:** one shape only (reach × adoption × lift × value).
- **The span:** a worst/best case, not a probability range (ADR 0001).
- **Fail closed** on bad input (ADR 0002).
- **No dependencies,** so there's no type checker or linter. `node --check` stands in (ADR 0003).
- **Lift up to 1000%,** and never negative.
- **Result ceiling** of $90 trillion, the largest value that rounds to the cent exactly.

## Couldn't verify
- **A visual review.** Screenshots timed out.
- **The copy button with a real click.**
- ~~CI on GitHub~~: now verified. The first run on the private repo `gurn3k/impact-sizer` passed on 2026-11-03.

## Pre-existing problems
None. This is a new project.

## Commands to run first
```
npm test
npm start   # then open http://127.0.0.1:4318
```
