# Gates

Nothing reaches the person until it has passed the gates. Gates run on the **rendered** result, not on intentions. `<plugin>` is this plugin's root folder (two levels above this file's `skills/` folder).

## Order

1. **Self-review** (the building specialist): put a screenshot next to the profile's top reference. Would it hold up? Fix before continuing.
2. **Lint**: `node <plugin>/scripts/cli.mjs lint <changed files or folders> --project <project>`
3. **Render**: `node <plugin>/scripts/cli.mjs render <url or html file> --out .apollo/render/<round>`
   - Widths 390, 768, 1440; light and dark; plus 1440 at 200% zoom.
   - Finds horizontal scroll, text overflowing its box, overlapping text and targets under 24px.
4. **Motion** (when anything animates): `node <plugin>/scripts/cli.mjs motion <url> --click <selector> --project <project>`, and again with `--reduced`.
   - One run per animation that matters (opening, primary transitions, signature detail).
   - Produces a flipbook at real speed.
5. **Critics**, each a fresh agent that never saw the build conversation:
   - `critic-slop`: screenshots against every critic rule in slop-list.md and the profile never-list.
   - `critic-motion`: runs the motion CLI itself and judges purpose and feel from the flipbooks.
   - `critic-break`: worst-case data plus accessibility.
   - `critic-contract`: ticks every line of `.design/contract.md`.
   - **Brief-fit** (inside `critic-slop`): the Director passes the quality words from the request ("vibey", "less generic", "catchy", "premium", "calmer", "bolder", "more exciting", or the lane's goal line). The critic answers each with **met** or **not met**, plus the evidence and the missing move. Any **not met** is a failed gate, exactly like a slop finding. "Cleaner, but not yet vibey" means not met.
6. **Privacy** (only before publishing anything public): `node <plugin>/scripts/cli.mjs privacy <folder>`

## Exit codes

| Code | Meaning | Report as |
|---|---|---|
| 0 | Clean | passed |
| 1 | Findings | failed, with the findings |
| 2 | Could not run (no Chrome, unreachable URL, wrong input) | **not run**, with the reason. Never as passed |

## The loop

- Failures go back to the specialist who built the work, with the exact findings.
- After a fix, re-run only the gates that failed, plus render (fixes often break layout).
- **At most 3 loops.** After the third, stop and hand over with the remaining findings listed plainly at the top. Do not keep polishing silently.
- **A brief-fit miss is never handed over as done.** If it is still "not met" after the loops, the hand-over opens with it ("You asked for vibey; the critic says it isn't yet, because…") and proposes the bolder move, instead of presenting the result as finished.

## Per lane

| Lane | Gates |
|---|---|
| Tweak | lint on the changed file, render (or motion, if the tweak was motion), contract check of the touched line |
| Refine, New, Replicate | all of them |
| Fix | the gate that showed the bug (render or motion), before and after |
| Review | all critics, report only, no fixes unless asked |
| Explore | lint and render on the concept mockups only |

## Lean mode

When the person asks for lean, quick or "native" work, or the budget is short:
- Run lint, render and motion as usual (they are cheap).
- Replace the four critics with one combined critic agent pass using all four briefs.
- Mention in the hand-over that the critics ran combined.

## Dev servers

The render and motion commands need a page. For a framework project, start its dev server in the background and pass the URL. A folder path exits 2 ("start the dev server and pass its URL").
