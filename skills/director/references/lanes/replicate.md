# Lane: Replicate

Rebuild a real product or operating-system UI 1:1, then add one honest twist. Eyeballed replicas get rejected; measured ones land.

## Steps

1. **Collect the real thing.**
   - Live product: open it and capture screenshots at the target size.
   - Measure computed styles of every visible element type (font family, size, weight, line height, letter-spacing, colours, radii, paddings, gaps, icon box sizes, shadows). With the browser tools, evaluate `getComputedStyle` on representative elements; write the table to `.design/replicate/measurements.md`.
   - Operating system UI: use real system assets (wallpapers, app icons, system symbols, system fonts) from the machine, not drawn stand-ins.
   - Real logos and icons from the product, never redrawn.
2. **Motion physics.** If the platform uses springs (docks, sheets, rubber-band scroll), match them, and declare it in the project layer so the motion gate doesn't flag it (`dials: motion: showcase`, plus a lesson noting "platform physics").
3. **Build** (brief **screens**): reproduce the measured values exactly. Font weights matter (450 is not 400). Icon boxes matter (14px vs 17px is visible). Don't redesign components the product already does well.
4. **Compare side by side.** Render the build at the same size (`cli.mjs render --widths <width> --themes light --zoom ""`) and put it next to the original screenshot. List every visible difference; fix until none are left that a careful person would notice.
5. **Hover and interaction.** Every element the original reacts to must react the same way (hover, press, open, previews). A replica with no hover states reads as fake.
6. **Gates:** lint, render, motion, then **one combined critic** (gates.md, "Combined critic") with the replica note: the target is a replica, so it judges the fidelity and the twist, not the source product's choices. At most 2 fix loops.
7. **The twist.** Only after fidelity holds: propose one honest twist that shows the person's hand (one detail, one interaction). Get a yes before building it.
8. **Hand over** with the side-by-side and the measurements table.

## Notes

- When the person prefers a slightly different value than the measured one ("the earlier, smaller logo"), theirs wins. Save it as a project lesson.
- Keep a list of what could not be matched exactly and why (missing font licence, unavailable asset).
