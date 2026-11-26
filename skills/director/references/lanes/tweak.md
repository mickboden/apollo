# Lane: Tweak

A named change in one place. Fast, exact, nothing else touched.

## Steps

1. **Restate** the change in one line if there is any doubt about the element or the property: "Greeting size, one step up. Nothing else."
2. **Find the value.** Read the current value (CSS, token, component prop). Note it.
3. **Change one step.** About 15–25% for sizes, spacing and durations ("a little" means one step; "a bit more" after a step means one more). For colours, move one step along the existing scale. Keep the old value in the project lessons or a comment so it can come back.
4. **Respect the agreed.** If the change contradicts a contract line, say so in one line and ask, or update the contract with the person's words as the source.
5. **Gates:**
   - `cli.mjs lint <changed file> --project <root>`
   - Visual change: `cli.mjs render <url or file>` (look at the screenshot of the touched area at phone and desktop).
   - Motion change: `cli.mjs motion <url> --click <selector>`.
   - Contract: confirm the touched line still holds.
6. **Hand over** in three lines: what changed (old → new value), the screenshot or flipbook, the gates.

## Don't

- Don't run agents. Do it in this thread.
- Don't "improve" neighbouring things, even obvious ones. Mention them in one line at most.
- Don't jump more than one step because "it'll probably need more".
- If the person says the result went the wrong way, revert to the kept value first, then step the other way.
