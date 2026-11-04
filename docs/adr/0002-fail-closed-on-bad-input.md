# 0002. Show no result when any input is invalid

## Decision
If any input is missing, not a number, out of range or out of order, the page hides every result and lists each problem by field.

## Alternatives
- Calculate with what's there and mark bad fields in red.
- Quietly fix inputs, for example by swapping low and high or capping adoption at 100%.

## Why
A number on screen will be copied into a doc, whatever warning sits next to it. A quietly fixed input would make a result whose arithmetic doesn't match the inputs the user typed, which breaks the product's claim.

## Consequences
A user part-way through typing sees an error list instead of a number. This trades a little friction for never showing a wrong figure. Errors name the field and the problem, so the user can fix them quickly.
