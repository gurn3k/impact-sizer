# 0003. Plain JavaScript, no dependencies

## Decision
Plain HTML, CSS and ES modules, tested with `node --test`. No framework, no build step, no npm dependencies.

## Alternatives
- Next.js and TypeScript, as in Redline.
- A spreadsheet template instead of a page.

## Why
It's one page with four inputs. A framework would add more code than the product has. Cap Drafter and Whose Move both shipped without a framework. A spreadsheet hides its formulas, which is the problem this tool solves.

## Consequences
There's no type checker and no linter, because adding either means adding a dependency. Instead, `npm run check` runs `node --check` on every file to catch syntax errors, and the tests carry the rest. Formatting numbers relies on the browser's `Intl.NumberFormat`.
