# Research summary

One pass per question, kept short because the product is small.

## Who has the pain
Product managers who have to put a number on an idea before it gets roadmap time: in a PRD, a prioritisation review, or a PM interview ("how would you size this?"). The number is usually a single figure in a spreadsheet cell, and reviewers can't see which assumption it depends on.

## What goes wrong
- A single point estimate hides how uncertain it is. Guides recommend giving a range (low / mid / high) instead.
- Nobody knows which assumption matters most, so validation effort goes to the wrong input. Sensitivity guides say to rank inputs by how much they swing the result and check the biggest one first.
- The arithmetic sits in hidden spreadsheet formulas, so a reviewer can't check it.

## What already exists
- **Heap's impact calculator post** (heap.io/blog/calculate-potential-impact): a funnel-style calculator that suggests trying different values to see how sensitive the outcome is. You change values by hand, and it doesn't rank inputs.
- **Aakash Gupta, "An Advanced Guide to Impact Sizing"** (news.aakashg.com): method, not a tool.
- **Sensitivity-range spreadsheets:** low/base/high per input, ranked by swing. Closest in spirit, but a spreadsheet you have to build yourself.
- **Claude skills for opportunity sizing** (openskillindex, claudskills.com): prompts that produce low/mid/high ranges as model output. The arithmetic is done by a model, so it isn't guaranteed.

**How this is different:** a free page with no sign-up that takes low/base/high for each input, ranks the inputs by swing, and shows the arithmetic behind every number, so a reviewer can check it by hand. No model does the maths.

## Who would pay
No one, and that's fine. This is a free portfolio tool. Success means a PM uses it in a real doc, not revenue.

## What this research does not show
- No PM has been asked whether they would use it. The pain comes from guides and course material, not from first-hand accounts.
- I didn't check whether a better free tool exists outside the first page of search results.
- The research covers one formula shape (reach × adoption × lift × value). Some ideas are sized differently (cost savings, time saved), and this research doesn't tell us how common those are.
