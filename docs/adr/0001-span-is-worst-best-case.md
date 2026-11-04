# 0001. The span is a worst/best case, not a confidence interval

## Decision
The low estimate multiplies every low input together, and the high estimate multiplies every high input together. The page calls this a worst/best case.

## Alternatives
- Monte Carlo sampling to give a 10th to 90th percentile range.
- Root-sum-square of each input's relative error.

## Why
The product's claim is that a reviewer can redo every number by hand. A product of four numbers can be checked with a phone calculator. A simulated percentile can't.

## Consequences
The span is wider than a realistic range, because all four inputs rarely land at their extremes together. A reader who treats it as a likely range will over-read the uncertainty. To cover this, the page and summary call it a worst/best case, and a test checks the summary never says "likely".
