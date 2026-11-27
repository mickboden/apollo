# Gates

Nothing reaches the person until it has passed the gates. Gates run on the **rendered** result, not on intentions. `cli.mjs <command>` means `node <plugin root>/scripts/cli.mjs <command>`; the Director's SKILL.md gives the root.

## Order

1. **Self-review** (the building specialist): put a screenshot next to the profile's top reference. Would it hold up? Fix before continuing.
2. **Lint**: `cli.mjs lint <changed files or folders> --project <project>`
3. **Render**: `cli.mjs render <url or html file> --out .apollo/render/<round>`
   - Widths 390, 768, 1440; light and dark; plus 1440 at 200% zoom.
   - Finds horizontal scroll, text overflowing its box, overlapping text and targets under 24px.
   - Text passing under a fixed or sticky bar is fine when it can be scrolled clear (the page pads for the bar); text that stays under the bar at every scroll position is an overlap.
   - Writes `render.json` (findings and shot list) next to the screenshots.
4. **Motion** (when anything animates): `cli.mjs motion <url> --click <selector> --project <project>`, and again with `--reduced`.
   - One run per animation that matters (opening, primary transitions, signature detail).
   - Produces a flipbook at real speed and `motion.json` (the measurement) next to it.
5. **Critics**, fresh agents that never saw the build conversation. How many depends on the lane (see **Rigor by lane**): usually **one combined critic**, the full panel only where the table says so.
   - **Reuse the gate artifacts.** Pass the render folder (screenshots + `render.json`) and each motion folder (flipbook + `motion.json`) from this round. Critics read them instead of rendering or measuring again; they re-run a command only for something missing, for a build newer than the artifacts, or for their own extra case (critic-break's worst-case data).
   - `critic-slop`: screenshots against every critic rule in slop-list.md and the profile never-list.
   - `critic-motion`: reads the motion gate's measurements and judges purpose and feel from the flipbooks.
   - `critic-break`: worst-case data plus accessibility.
   - `critic-contract`: ticks every line of `.design/contract.md`.
   - **Brief-fit** (inside `critic-slop`): the Director passes the quality words from the request ("vibey", "less generic", "catchy", "premium", "calmer", "bolder", "more exciting", or the lane's goal line). The critic answers each with **met** or **not met**, plus the evidence and the missing move. Any **not met** is a failed gate, exactly like a slop finding. "Cleaner, but not yet vibey" means not met.
6. **Privacy** (only before publishing anything public): `cli.mjs privacy <folder>`

## Exit codes

| Code | Meaning | Report as |
|---|---|---|
| 0 | Clean | passed |
| 1 | Findings | failed, with the findings |
| 2 | Could not run (no Chrome, unreachable URL, wrong input) | **not run**, with the reason. Never as passed |

## Combined critic

One fresh `critic-slop` agent briefed to apply all four critic files in one pass (`agents/critic-slop.md`, `critic-motion.md`, `critic-break.md`, `critic-contract.md`; the agent reads the other three itself), with the brief-fit words and the gate artifacts. It returns one ranked list with each finding tagged slop / motion / break / contract / brief-fit. Same bar, a quarter of the agents and renders.

## The loop

- Failures go back to the specialist who built the work, with the exact findings. Verify each finding first (`superpowers:receiving-code-review`, if installed): a wrong one gets an override with its reason, not a fix.
- Each fix starts from the cause, not the symptom (`superpowers:systematic-debugging`, if installed, outside Tweak), so the same finding doesn't come back next loop. Neither skill raises the cap.
- After a fix, re-run only the gates that failed, plus render (fixes often break layout). Re-run only the critic checks that failed, on the new artifacts.
- **Fix loops are capped per lane** (table below; never more than 2). When the cap is reached, stop and hand over with the remaining findings listed plainly at the top. Do not keep polishing silently.
- Record each gate result and each loop with `cli.mjs progress add` (SKILL.md, "Checkpoints").
- **A brief-fit miss is never handed over as done.** If it is still "not met" after the loops, the hand-over opens with it ("You asked for vibey; the critic says it isn't yet, because…") and proposes the bolder move, instead of presenting the result as finished.

## Rigor by lane

The CLI gates are cheap and always run where they apply. Critics are the expensive part, so each lane gets only the critic pass that can change its outcome. Most predictable findings (long words, clipped focus rings, unpadded fixed bars, text colliding in flight) are prevented by the specialists' build checklist, not caught here.

| Lane | CLI gates | Critics | Fix loops |
|---|---|---|---|
| Tweak | lint on the changed file; render (or motion, if the tweak was motion); the touched contract line | none | 1 |
| Fix | the gate that showed the bug, before and after; render on the whole page | one combined critic, focused on break and contract | 2 |
| Refine | lint, render, motion if anything animates | one combined critic (with before-screenshots and brief-fit) | 2 |
| New | concepts: lint and render only. Final build: lint, render, motion | full panel (four in parallel) on the **final build only** | 2 |
| Explore | lint and render on the concept mockups | none (no build; the ratings are the check) | 1 |
| Replicate | lint, render, motion | one combined critic with the replica note (fidelity and the twist) | 2 |
| Review | render, lint, motion on the target | full panel in parallel; no builder, no fixes unless asked | none |

The person asking for "thorough", "full review" or similar gets the full panel in any build lane.

## Lean mode

When the person asks for lean, quick or "native" work, or the budget is short:
- Run lint, render and motion as usual (they are cheap).
- New and Review also drop to one combined critic.
- Mention in the hand-over that the critics ran combined.

## Overrides

A gate can be wrong. When a specific finding is a false positive, or the design does it on purpose for a stated reason, the Director (never the specialist) may override **that one finding**:

1. Write the reason in a sentence: what the finding is and why it is not a problem here ("`.cta × .nav` overlap at 390: the bar is fixed and the page pads 88px for it; the capture is mid-scroll").
2. Record it: `cli.mjs progress override --gate <gate> --finding "<the finding as reported>" --reason "<the sentence>"`, and add it to the contract's **Overrides** section.
3. State it in the hand-over's gate line: "render: passed, 1 override (reason)".

Never override: a gate that exited 2 (that is **not run**), a brief-fit miss, contrast below the minimum, horizontal scroll, or anything the person asked for by name. If the same override recurs across projects, the gate is what needs fixing: say so.

## Dev servers

The render and motion commands need a page. For a framework project, start its dev server in the background and pass the URL. A folder path exits 2 ("start the dev server and pass its URL").
