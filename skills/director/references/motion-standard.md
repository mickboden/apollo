# Motion standard

Smooth is the one non-negotiable. Everything else depends on the motion dial. Motion is measured with `cli.mjs motion`, never assumed from reading code.

## The dial

| Dial | Where | Allowed |
|---|---|---|
| `still` | Dense tools, print-like pages | Opacity and colour only, ≤160ms, for feedback |
| `calm` (default) | Working product UI | Opacity, colours, box-shadow, transform for press and tiny nudges. Translate ≤8px, scale 0.95–1.08. ≤240ms. No overshoot, no stagger, no blur. One exception: a one-axis reveal (an underline or bar drawing in with `scaleX` or `scaleY` from 0 to 1, the other axis staying at 1), ≤240ms. Width/height only on an element marked `data-motion="reveal"` |
| `expressive` | Marketing pages, onboarding, empty states | Adds clip-path, larger translate, ≤600ms. Still no overshoot |
| `showcase` | Portfolios, case studies, openings, launches | Anything, as long as it is smooth and has a purpose |

Exemptions (any dial): mark an element with `data-motion="opening"` or `data-motion="reveal"` and it may run up to 3000ms. Reveal also allows a stagger. Use these honestly: an opening plays once per session; a reveal shows data arriving (a line drawing itself, bars growing).

The motion CLI enforces exactly this table.

## Openings

**Openings default to `showcase` energy and creativity 4,** whatever the project's dial says for its working UI. An opening is a showcase moment: it's the one place the product gets to perform. A calm fade is not an opening.

- Tell a tiny story in 2–4 beats: a question typed and sent, statements cut hard one after another, an identity colour filling the mark, a real object arriving where it belongs.
- Use the product's own material (its composer, its logo, its data, its people) rather than abstract shapes.
- One confident hero beat that is big, fast or surprising, then a clean hand-off to the page.
- About 2–3s in total, once per session, skippable, `data-motion="opening"`.
- **The memory test:** would someone remember it an hour later and describe it to a colleague? "It faded in nicely" fails. Rework until the answer is a specific image.
- Smoothness still applies: measure it with `cli.mjs motion`.

## Numbers

| What | Value |
|---|---|
| Press feedback | scale .97 (buttons), .99 (cards), ~120ms |
| Hover, colour change | 140–160ms |
| Fades (toasts, menus, dialogs) | 150–180ms |
| Sheets, picture crossfades | 220–240ms |
| Identity colour change (a tile filling) | ~280ms |
| One signature move (a hop, a glide) | ~320ms |
| Opening sequence | ≤ ~3s in total, once per session |
| Data draw (line, bars) | up to ~2.4s, replays when the view opens again |
| Enter easing | `cubic-bezier(.22,1,.36,1)` |
| Move on screen | `cubic-bezier(.65,0,.35,1)` |
| Sheets | `cubic-bezier(.32,.72,0,1)` |

Exits are faster than entrances (roughly 60–75% of the entrance time). Exit timing is sensitive: tune it with the person, in small steps.

## Decide in this order

For every animation, before writing it:

1. **Should it move at all?** If nothing changes state, it doesn't animate. A static element is better than a decorative one.
2. **What is the purpose?** Feedback, orientation (where did it go?), continuity (this became that), or story (an opening). Write it down in one line.
3. **Which property?** Prefer opacity and colour. Transform only for press, tiny nudges, and the one signature move.
4. **Which curve and duration?** From the table. No overshoot unless the dial is showcase or the project replicates a platform that uses springs.
5. **How does it interrupt?** A second click mid-animation must not jump or queue. Use transitions (which retarget), not keyframes, for anything the user can trigger repeatedly.
6. **How does it exit?** Faster, and never with more movement than it entered with.

## What wins and what loses

Wins (meaningful motion):
- A composer that types a question, then cuts to the page.
- Short statement cuts on a dark stage, the last word grey.
- A logo tile that fills from the bottom in the team colour.
- A chart that draws itself, a little slower than feels necessary, and replays on return.
- A small hop that shows where an item went.
- Hover dimming of everything except the hovered row.

Loses (decorative motion):
- Generic fade-up stagger on page load.
- Spring pop-ins, bounce, count-ups for their own sake.
- Shutter or aperture reveals.
- Sideways slides or blur smears on content swaps: they shift the picture and feel hectic.
- Looping ambient hints.
- Glowing, pulsing or running dots.

## Small-step tuning

When the person says "a little faster" or "a little more time":

- Change one parameter (duration *or* delay *or* curve), by about 15–25%.
- Keep the previous value in a comment or the project lessons so it can come back.
- Change only the animation they named.

## Platform physics

When replicating an operating system or a product that itself uses springs (a dock, a sheet, rubber-band scroll), match its physics instead of the calm table. Declare it in the project layer (`motion: showcase` or a lesson) so the gates don't flag it.

## Reduced motion

Under `prefers-reduced-motion: reduce`, keep the fades and remove transform, filter and clip-path movement. The motion CLI's `--reduced` flag checks this.

## Smoothness

The motion gate fails on more than about one dropped frame per second of animation, or a 95th-percentile frame time over 20ms. Fixes, in order: animate compositor-friendly properties (opacity, transform); move work off the main thread during the animation; avoid layout reads in animation frames; drop blur and large backdrop-filters.
