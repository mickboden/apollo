# Lane: Fix

Something is broken: an animation stutters, text overflows, elements overlap, a state doesn't work, dark mode shows a white fill. Find the cause before touching anything.

## Steps

1. **Reproduce with a measurement**, not a guess:
   - Layout: `node <plugin>/scripts/cli.mjs render <url> --json` (at the width and theme where it breaks; add `--widths`/`--themes`).
   - Motion: `node <plugin>/scripts/cli.mjs motion <url> --click <selector> --json` (look at dropped frames, p95, properties, durations; open the flipbook).
   - Behaviour: drive the interaction in the browser and capture the broken state.
   Save this as the "before" evidence.
2. **Find the root cause.** Read the code path that produces the measured symptom. Form one hypothesis, test it with the smallest change or a probe, and confirm before fixing. If `superpowers:systematic-debugging` is installed, follow it.
3. **Fix the cause,** not the symptom. Typical causes and fixes:
   - Jank: layout properties animated → transform/opacity; main-thread work during the animation → defer it; blur or large backdrop-filters → remove; layout reads inside animation frames → batch them.
   - Overflow: fixed widths → fluid; `nowrap` on user text → wrap; a two-column layout that breaks when zoomed → raise the breakpoint.
   - Overlap: absolute positioning over flowing content → put it in the flow.
   - Theme bugs: hard-coded colours → tokens defined for both themes.
4. **Measure again** with the same command. The "after" must be clean at the same widths, themes and triggers.
5. **Check neighbours:** run render on the whole page (the fix must not break something else).
6. **Hand over:** the cause in one sentence, the change, and before/after evidence.

## Don't

- Don't redesign while fixing. If the design itself is the problem, say so and offer the Refine lane.
- Don't stack guesses. If the first hypothesis fails, go back to step 2 with the new information.
