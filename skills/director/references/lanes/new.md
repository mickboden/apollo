# Lane: New

A new page, feature, app, opening, deck or figure. The full flow. The goal: the first concepts the person sees are already at the bar.

## 0. Load

Context output. If there is no `.design/`, run `cli.mjs project init` (with `--brand` when a brand applies). Give the time estimate in one line.

## 1. Brief

Ask only what the profile and the project can't answer, and only what would change the design. One message, at most three questions, using the structured question tool when available. Typical gaps:
- What is it, and who looks at it (role)?
- What should they do or feel? What does success look like?
- What must not change, and what would make a polished result feel wrong?

Write the answers into `.design/project.md` (body), with the surface mode (Persuade, Operate, Read, Experience).

## 2. Dials

Show the seven dials pre-set from the context output as a `dials` deck on the board ([dials.md](../dials.md), [board.md](../board.md)). Each option card is a tiny rendered version of the screen: real swatches, real type, a frame of the motion level. Only ask the dials where the profile has no strong default for this kind of surface. The person changes what differs or says go. Save changed dials to the project layer.

In lean mode, skip the board: state the dials in one line and let the person correct them.

## 3. References (Scout, inline in phase 1)

Gather about 10 references that span a real range. Sources, in order:
1. The profile's own `refs.jsonl` (♥ and 4–5 scores), filtered to this kind of surface.
2. Mobbin (`search_screens`, `search_flows`, `search_sections`) when the Mobbin MCP is connected.
3. Live sites and products via the browser tools or web search: the competitors and the best-in-class outside the category.

For each, take a screenshot (`cli.mjs render <url> --widths 1440 --themes light --zoom "" --out .design/board/<round>/refs/<id>`) and write one `why` line naming a specific quality. Build a `refs` deck with `"layer": "personal"` (or the brand) and serve it. The person rates; ♥/✕ write into the profile.

Skip this step only when the person says so, or when the project already has a rated reference round for this surface.

## 4. Concepts

Brief the **screens** agent (and **motion** for openings and signature motion) with the context, the brief, the dials and the rated references (winners and losers, with notes). The agent follows its new-work playbook:
- 8–10 directions internally, category-generic ones cut.
- **3 truly different concepts at the creativity dial, plus 1 wild card one level higher** (lean: 2).
- Each concept recombines traits from several ♥ references in the product's own material; none closely copies one.
- Each is an HTML mockup of the first viewport, inside the real product chrome when one exists, with real content.

Before showing, run lint and render on the mockups; fix what fails. Then a `concepts` deck on the board. The person rates 1–5 and may mix picks.

## 5. Contract

Write `.design/contract.md` ([contract.md](../contract.md)): every agreed colour, type decision, motion, element, copy line and pick, each with its value and source. Show it to the person in a short list; their go is the approval.

## 6. Build

Brief **screens** (and **motion**) with the contract, the picked concept, the context, the output dial and the gates. Default output is a clickable local prototype.

## 7. Gates

All gates ([gates.md](../gates.md)): self-review against the top reference, lint, render, motion for every animation that matters (and `--reduced`), then **critic-slop**, **critic-motion**, **critic-break** and **critic-contract** in parallel, on the **final build only** (concept mockups get lint and render, nothing more). Give the critics this round's render and motion folders. Failures go back to the specialist; at most 2 fix loops. In lean mode, one combined critic instead of the panel.

## 8. Hand over

SKILL.md §8. Then learn: save what the person liked about the result, in their words.

## Special surfaces

- **Openings:** run at creativity 4 and showcase energy by default (motion-standard.md, "Openings"). Lead with a content or language moment (typing, statement cuts, an identity fill) built from the product's own material: 2–4 beats, one confident hero beat, about 2–3s, once per session, `data-motion="opening"`. Show the concepts as flipbooks on the board. Before showing, each concept must pass the memory test ("what would someone describe an hour later?"); "catchy" is the bar, calm is not.
- **Decks, Figma, figures, imagery:** same flow, but the specialist work routes per [upstream.md](../upstream.md), "Phase-2 routes".
