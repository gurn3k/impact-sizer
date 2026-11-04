# Glossary

- **Input:** one of the four factors: reach, adoption, lift, value.
- **Scenario:** low, base or high. Each input has a value for each scenario.
- **Base estimate:** the product of every input's base value.
- **Span:** low estimate to high estimate, where the low estimate is every input at its low value and the high estimate is every input at its high value. It is a worst/best case, **not** a confidence interval. Never call it "likely" or "probable".
- **Swing:** for one input, the result with that input at high minus the result with it at low, all other inputs at base.
- **Driver:** the input with the largest swing.
- **Fail closed:** when any input is invalid, the page shows no result, only the list of problems.
