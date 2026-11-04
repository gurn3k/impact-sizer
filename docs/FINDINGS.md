# Findings

From the smoke and adversarial passes, 2026-11-03.

- **Where:** the real page in Chrome, served by `npm start` on 127.0.0.1. It was not deployed (deploying needs the owner's OK). Typing was driven through the page's DOM with real `input` events, because Chrome screenshots timed out in this session.
- **Budget:** about 30 inputs across 14 cases, plus a copy-button test and a check of the 375px phone layout.
- **Inputs tried:** empty, tiny (reach 1), all zero, huge (1e20), words, `$1,200`, European decimal `0,5`, Arabic-Indic digits, `0x10`, `+5`, `Infinity`, markup with an `onerror` handler, adoption 101%, negative lift (outside the product's remit), and a double click on Copy.

## 1. "0,5" was silently read as 5
- **Steps:** set Lift low to `0,5`.
- **Promise broken:** P5, "When any input ... isn't a number ... the page shows **no** result". Also the claim that every number can be redone from the inputs the user typed.
- **What happened:** commas were stripped, so `0,5` became `5`. The page showed a result for 5% lift. A European user meaning 0.5% got a figure ten times too high, with no warning.
- **Seriousness:** high. A wrong number looks right and gets copied into a doc.
- **Status:** Fixed. Commas are accepted only as thousands separators (`1,200`). Anything else is refused with "use digits, like 1,250.5". Test: `test/findings.test.js` finding 1.

## 2. "0x10" was read as 16
- **Steps:** set Users reached low to `0x10`.
- **Promise broken:** P5.
- **What happened:** JavaScript's `Number()` accepts hex, binary and octal, so the page used 16 without comment.
- **Seriousness:** low. Unlikely to be typed, but it's the same class of bug as finding 1.
- **Status:** Fixed. Only decimal digits are accepted, with an optional exponent. Test: finding 2.

## 3. Copy summary could hang with no message
- **Steps:** click Copy summary twice, then wait 2 seconds.
- **Promise broken:** none in the PRD. The button looked dead.
- **What happened:** `navigator.clipboard.writeText` never settled, so no "Copied." and no error appeared. This was reproduced with an automated click only. A real click may behave differently, but the page shouldn't depend on it.
- **Seriousness:** medium. The summary is half the reason to use the page.
- **Status:** Fixed. The write now gives up after 1.5 seconds, selects the summary text and says "press Ctrl+C". Re-checked in Chrome. Test: finding 3.

## 4. "$0.6" instead of "$0.60"
- **Steps:** set reach to 1 for low, base and high.
- **What happened:** money with cents dropped the trailing zero.
- **Seriousness:** cosmetic.
- **Status:** Fixed. Test: finding 4.

## 5. Stale error text stayed in the page
- **Steps:** make an input invalid, then fix it.
- **What happened:** the error list was hidden but its old text stayed in the DOM, where a screen reader or a copy-all could still reach it.
- **Seriousness:** low.
- **Status:** Fixed. The list is cleared on every render. The test reads the source rather than a live DOM.

## 6. The local server crashed on a malformed URL (security review)
- **Steps:** request `/%E0`.
- **What happened:** `decodeURIComponent` threw outside the handler's `try`, which would stop the dev server.
- **Seriousness:** low. It's local only and bound to 127.0.0.1, and production hosting doesn't use it.
- **Status:** Fixed. Path handling moved to `scripts/resolve-path.mjs`, which never throws. Tests cover malformed escapes and seven path-escape attempts.

## What held up
- **Bad input:** empty, words, Arabic-Indic digits, `Infinity`, over 100%, negative and out-of-order inputs all failed closed, and each named its field.
- **Markup:** the `onerror` handler never ran, because user text is only ever set with `textContent`.
- **Too large:** 1e20 users showed no number, only "too large to show to the cent".
- **Edge values:** all-zero inputs gave $0 and no driver, with no crash and no division by zero.
- **Phone width:** no horizontal scroll at 375px.
- **The smoke run:** it matched the hand-computed fixture exactly: $15,000 / $120,000 / $420,000, with swings of 144k, 120k, 60k and 40k and lift as the driver.

## Owner review (2026-11-04)
- **Looking at the page:** the owner looked at it in Chrome on desktop and in DevTools phone emulation. It looked fine on both. No real phone was used.
- **The copy button with a real human click:** it works. The summary pasted into Notepad, so the earlier hang came from the automated click.

### Real sizing: Duolingo "Streak Repair"
Built from public figures, using monthly active users throughout.

| Input | Low | Base | High |
|---|---|---|---|
| Users reached | 140.6M | 150M | 170M |
| Share who use it | 3.6% | 10% | 15.6% |
| Lift in value per user | 1% | 1.7% | 3.3% |
| Value per user per year | $8.00 | $8.80 | $9.00 |

- **What the page showed:** a base of $2,244,000 and a worst-to-best span of $404,928 to $7,876,440. The ranking was lift ($1.32M to $4.36M), then share who use it, users reached and value per user.
- **Hand-check:** the base, both ends of the span and the lift bar all match.
- **Interpretation:**
  - A 19× span is too wide to decide on by itself. The ranking is what makes the tool useful: lift and adoption each move the result by about $3M, while reach and value move it by under $0.5M. The effort should go into pinning down adoption and lift, not into user counts.
  - I'd paste the summary into a planning doc almost as it is, adding sources by hand.
  - I'd use it again once the percentage trap (finding 7) is fixed.
- **Mistakes that were handled well:** a comma decimal ("8,8") was blocked with a clear message, a blank field was flagged, and a low above the base was caught (but see finding 9).
- **Missing, and out of scope for version one on purpose:** there's nowhere to note sources next to inputs, and no way to save a scenario.

## 7. Percentages typed as fractions were accepted silently
- **Steps:** type lift as `0.01` / `0.017` / `0.033`, meaning 1% / 1.7% / 3.3%.
- **What happened:** the page showed $22,440 instead of $2,244,000, a plausible-looking result 100 times too small, with no warning.
- **Seriousness:** high. A wrong number looks right and gets copied into a doc.
- **Status:** Fixed. When every value in a percent row is under 1% (and they aren't all zero), the page warns "every value is under 1%. If you meant 0.01 to be 1%, type 1." It's a warning, not a block, because a real lift of 0.5% is valid, so the result still shows. Re-checked in Chrome. Test: finding 7.

## 8. The written arithmetic rounded percentages
- **Steps:** enter a lift of `0.017`.
- **Promise broken:** the core claim that every number can be redone by hand from what's on screen.
- **What happened:** the base line read "× 0.02% ×", which multiplies out to $26,400, not the $22,440 shown.
- **Seriousness:** medium. It only shows with percentages that have more than two decimal places, but it breaks the product's one claim.
- **Status:** Fixed. Inputs in the arithmetic keep every decimal place that was typed. Re-checked in Chrome: "150,000,000 × 10% × 0.017% × $8.80 = $22,440". Test: finding 8, which redoes the sum from the displayed text.

## 9. A low above both base and high named only the base
- **Steps:** set Share who use it to low `20`, base `10`, high `15.6`.
- **What happened:** the message said "low is above base", but the low was above the high too.
- **Seriousness:** low. The page still failed closed.
- **Status:** Fixed. It now says "low is above base and high". Re-checked in Chrome. Test: finding 9.

## 10. A European thousands dot was read as a decimal
- **Steps:** set Users reached base to `1.200`, meaning 1,200 in much of Europe.
- **What happened:** it was read as 1.2 users, a result a thousand times too small, with no warning. `$1.200` as value per user was read as $1.20 in the same way.
- **Seriousness:** high. A wrong number looks right. It was found in the pre-ship check of locale handling, after finding 1 covered decimal commas but not thousands dots.
- **Status:** Fixed. Users reached must be a whole number, and the page says to type thousands as 1,200 or 1200. A money value with exactly three decimals (`1.200`, `$1.200`) is refused as ambiguous and the page asks for 1,200 or 1.20. Percentages are unchanged, because 1.234% is a real value. Test: finding 10.

## Live pass on https://impact-sizer.vercel.app (2026-11-04)
- **Inputs tried (18 cases):** the default example, an empty field, tiny (reach 1), huge (1e20), words, Arabic-Indic digits, `0,5`, `1.200`, `$1.200`, `1 200`, `0x10`, markup with an `onerror` handler, adoption 101%, negative lift, percentages typed as fractions, all-zero adoption, a low above base and high, and `Infinity`.
- **Result:** every case behaved as on the local server. Bad input failed closed and named its field, fractions warned but still showed a result, and all-zero gave $0. The markup handler never ran.
- **The site itself:** only the page files are served. Docs, tests, config and hidden files return 404. The security headers (CSP, nosniff, referrer and permissions policies) are live, and the page loads with no console errors under the CSP.
- **Not repeated live:** the copy button (an automated click hangs the clipboard; the owner checked it by hand locally) and phone width.

## Not tested
- **A real phone:** only DevTools emulation was used.
- **Screen readers.**
- **Browsers other than Chrome.**
