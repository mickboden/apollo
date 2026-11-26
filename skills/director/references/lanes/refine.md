# Lane: Refine

Make an existing screen better while keeping its identity. The person should recognise it, and like it more.

## Steps

1. **Load and look.** Context output, the project's contract, and a render of the current state:
   `cli.mjs render <url> --out .design/board/<round>/before`
2. **Quick critique** (in this thread, 5–8 lines): what already works (keep it), and the 3 biggest gaps against base taste, density and the top reference. Name each gap concretely ("9 modules on the home screen; budget is 4", "cards carry three tints").
3. **Restate the goal** in one line, in the person's terms.
4. **Options.** Brief the **screens** agent (and **motion** if motion is in scope) to make 2–3 options. **Each option changes one axis**, for example:
   - A: density (cut to the budget, details behind a click)
   - B: hierarchy (one hero fact, the rest quieter)
   - C: one meaningful character detail
   Each option is a clickable HTML mockup inside the real product chrome, with real content. The quiet option must be excellent; one option may be bolder.
5. **Board.** Write a `concepts` deck (`.design/board/<round>/deck.json`), serve it, and let the person rate. Read the results.
6. **Learn.** Save what won and why (`cli.mjs learn`), and say it in one line.
7. **Contract.** Add the picked changes as contract lines, with values and the round as source.
8. **Build.** Brief **screens** to apply the pick to the real code (output dial: usually `prototype`, or `production` if the project is code). Include the contract and the gate list.
9. **Gates.** All of them ([gates.md](../gates.md)): lint, render, motion if anything animates, then the four critics in parallel. Loop at most 3 times.
10. **Hand over** (SKILL.md §8).

## Shortcuts

- If the person already named the direction ("make it calmer", "less information"), skip the options and go to step 7 with that direction as the pick; the gates still run.
- If the dials and contract are settled and the person asks for "polish", go straight to building with the polish playbook (`screens polish`).
