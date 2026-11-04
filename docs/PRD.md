# PRD: Impact Sizer

## Who it's for and what they do today
A product manager who has to size an idea before it gets roadmap time, in a PRD, a prioritisation review or an interview. Today they type one figure into a spreadsheet, hide the formula in a cell, and the reviewer can't see which assumption it rests on.

Not for: finance teams building full business cases, or anyone who needs probability ranges (see "What it deliberately doesn't do").

## The problem
One number hides two things a reviewer needs: how wide the uncertainty is, and which assumption drives it. So the team argues about the wrong input.

## What version one does
1. Takes low, base and high values for four inputs: users reached, share who adopt (%), lift in value per user (%), value per user per year.
2. Shows the base estimate, the low-to-high span, and the arithmetic for each.
3. Ranks the inputs by swing, drawn to scale, and names the driver.
4. Gives a summary paragraph to paste into a PRD.
5. Opens with a worked example already filled in.

## What it deliberately doesn't do
Other formula shapes, probability ranges, negative lift, accounts or saving, model calls. Reasons are in `docs/adr/`.

## The calls I made
- The span multiplies all the lows together and all the highs together. That's easy to check by hand, but wider than a realistic range. The page says so (ADR 0001).
- The page shows no result when any input is invalid, instead of guessing (ADR 0002).
- The page runs with no framework and no dependencies (ADR 0003).

## What good looks like (each one is testable)
- P1. Every result equals the product of the inputs it names, to the cent.
- P2. Every displayed result has a line showing its arithmetic, and that line holds the same values as the inputs on screen.
- P3. Low estimate ≤ base estimate ≤ high estimate for every valid input set.
- P4. Inputs are ranked by swing, largest first. Each swing equals result(input at high) − result(input at low), with the other inputs at base.
- P5. When any input is missing, isn't a number, is out of range or is out of order (low > base or base > high), the page shows **no** result and names each bad field.
- P6. When a result is too large to represent exactly, the page shows no result and says why.
- P7. The summary paragraph contains the same base, low, high and driver figures as the page, and calls the span a worst/best case, never "likely".
- P8. The pre-filled example gives the hand-computed answers in `fixtures/worked-examples.json`.

## How it's measured
`npm test` checks P1 to P8 against hand-computed fixtures. The page is checked once in a real browser.
