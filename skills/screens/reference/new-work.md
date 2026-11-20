# New visual work

Use this flow for a new surface or a replacement visual identity. PRODUCT.md owns product truth. DESIGN.md owns durable visual decisions. The project layer (`.design/project.md`) holds strategy that belongs to this job, and `.design/contract.md` holds everything agreed. Complete [init.md](init.md) first when PRODUCT.md is missing; a missing DESIGN.md does not route back to init.

The Director runs the conversation (brief, dials, references, concepts on the board, contract). This file is how the screens specialist turns that into a surface.

## 1. Decide what is already true

Read the context output, DESIGN.md, representative code, tokens, components and assets.

- **Host first.** Inside an existing product, a new surface must look like it was always there. Inventory its tokens (colours, type, weights, radii, spacing, icon sizes) and components before drawing anything. A new look only comes with a creativity dial of 3 or more *and* an explicit twist in the contract.
- **Redesign:** preserve product truth, content, function, constraints and explicit brand commitments; replace the old visual world rather than polishing it. The old look is evidence of what the subject is, not authority over what it becomes.
- **Established world:** inherit it. A missing DESIGN.md does not erase a coherent identity already in code; document that identity instead of inventing a replacement.
- **Incomplete brand:** preserve confirmed assets and recognizable traits, then expand the system with the user for this surface.
- **No visual authority:** create a new world with the user.

A section, component, feature or state inside an established surface inherits that surface. Never turn a local addition into a new identity exercise.

## 2. Know what will change the work

The Director has asked the brief questions. If anything below is still unknown and would change the build, return the question to the Director instead of guessing.

- **Persuade:** who must act, what they should believe, which real proof, content or assets earn that belief.
- **Operate:** the task, information, important states, frequency, constraints, who looks at it (role).
- **Read:** the reader's question, source material, structure, wayfinding.
- **Experience:** what leads, how exploration unfolds, which interaction or transition matters.

Across modes: what success looks like, what must remain untouched, and what would make a polished result feel wrong. Never ask for CSS values.

## 3. Choose the right amount of invention

### Extend an existing surface

Inherit its world and composition. Resolve only the new purpose, content, hierarchy, states, interaction, and how the addition joins the surrounding experience. No concept round, and no DESIGN.md change unless the user approves a durable system change.

### Create a whole surface inside an established world

Keep the visual system fixed. Derive five to seven materially different structures from the content, task and user behavior. Rank them by how well they serve the job, then send the Director three that genuinely differ in composition (not three variants of one layout), plus one wild card one creativity level higher. Each goes on the board as an HTML mockup of the first viewport **inside the real product chrome** (its nav, its header, its sidebar). Free-floating mockups land worse than ones shown in place. Use real content.

### Create or replace the visual world

1. Name the product's unique mechanism in one sentence, the audience's real scene, its cultural home, and what this first surface must prove. Note the page this category always ships and its predictable opposite; both are the rut, kept out of the candidate list. A brief that paints its own picture (a product name, a governing metaphor) adds its literal reading to the rut: spend at most one candidate on it, and read metaphors as moods.
2. From the references the person rated (♥ and high scores, with their notes) and from that cultural world, list seven concrete visual systems, artifacts, places or rituals the audience knows by heart, each with one line on why it resonates and one on how it looks (ground and main colours, type voices, the one signature that makes it recognisable). The audience's world includes its graphic and screen traditions, not only its physical objects. On an Operate or Read surface, never take the look of the tools the audience operates (a terminal, a control panel): it comes back as a costume. When more than three of the seven share one material family, dig until the list spans at least three families.
3. Turn that material into complete directions: each joins a reusable visual world to a concrete first-surface experience.
4. Generate 8–10 directions internally, then cut every one that someone could guess from the category alone. Present three that are truly different at the chosen creativity level, plus one wild card a level higher. Every direction recombines traits from **several** rated references in the product's own material; none may closely copy one reference.
5. Each direction goes to the Director as a board card: an HTML mockup of the first viewport with real content, plus a card `why` naming its thesis in one line. On the card body (as HTML in the mockup or as the why), give: thesis, palette, type, first viewport, signature interaction, honest risk.

Every direction must already be viable: every relationship and claim it shows true, a real palette and component family, a distinctive composition with one product-specific experience, workable at full scale with the available assets. In greenfield work, author illustrative material at full fidelity and label it synthetic where a visitor could mistake it for real; commercial and factual claims (prices, customers, benchmarks, capabilities) stay uninventable.

The mode's rules govern every direction: [mode-persuade.md](mode-persuade.md) for Persuade and Experience, [mode-operate.md](mode-operate.md), [mode-read.md](mode-read.md).

## 4. Commit the world

Colour follows the colour dial (`references/dials.md`):
- `neutral-accent` (the default): neutral ground, near-black ink, one accent for action; further colours only where they encode meaning.
- `brand-exact`: the brand profile's tokens, nothing invented.
- `two-tone`, `expressive`, `dark-stage`: bolder strategies, still with every colour doing a job and never as washes over cards.

Dark or light is never picked by category: write one sentence of physical scene (who uses this, where, under what light) and let it decide, unless the dial or the brand already has.

Type follows the type dial and the brand profile. When the type is free, choose faces like objects from the subject's world, in the mode's register. Operate and Read surfaces are well served by system stacks and workhorse UI faces. Persuade and Experience surfaces want faces with a point of view, and these training-data defaults mean you stopped looking: Fraunces, Playfair Display, Cormorant, Lora, Crimson, Newsreader, Syne, Space Grotesk, Space Mono, IBM Plex, Inter-as-display, DM Sans, DM Serif, Outfit, Plus Jakarta Sans, Instrument Sans. A brand that already uses one of them keeps it.

Calibration: AI-generated interfaces cluster around a few looks regardless of subject: warm cream ground, high-contrast serif display and a terracotta accent; near-black with one neon accent and glowing edges; broadsheet hairlines, italic display serif and small tracked mono labels; flat saturated ink with black boxes, hard offset shadows and heavy condensed display type. Where the brief leaves the aesthetic free, landing in one means the self-check failed: if someone could guess your aesthetic from the category alone, rework until it is not obvious. Your measured prior for warm, bookish or child-facing subjects is cream plus serif plus lamplight; treat that palette as already spent.

## 5. Record the decision

Before code, the Director writes the picks into `.design/contract.md` (`references/contract.md`). Add a `## Direction` section to `.design/project.md` with six short blocks, about 150 words in all:

- THESIS: the one idea this surface owns and the category-default arrangement it refuses.
- OWN-WORLD: the palette and component language, specific enough to be recognizable with all content removed.
- STORY: what the visitor understands, believes and does.
- FIRST VIEWPORT: the exact composition, what is where and at what scale, and where the primary action sits.
- SIGNATURE: the one interaction or motion people will remember, with its purpose.
- DENSITY: the information budget for this surface (`references/density.md`).

If a block reads like a mood, the direction is not decided yet. Never copy these blocks into implementation source, comments, hidden DOM or anything the browser receives.

On a new or replacement world, DESIGN.md is written at finish, from the built world ([document.md](document.md)). An ordinary extension does not rewrite DESIGN.md.

For `shape`, return the selected direction to [shape.md](shape.md) and stop before implementation.

## 6. Build with full commitment

Build the chosen direction, not a safer interpretation of it. The form supplies structure, reading order, component conventions and native motion; the product supplies every fact. Commit every atom: nav, buttons, inputs and links are rebuilt in the world's vocabulary, and a stock component inside a committed form is a lapse. Land the first build fully committed; later passes make the committed thing clear and effective, never dilute it.

- **The first viewport is a thesis, not a header.** Demonstrate the mechanism immediately, at the scale the form has in life. The memory test: if someone left after one viewport, what would they describe an hour later? If the honest answer is a mood, the concept has not committed yet.
- **Respect the density budget.** One hero, then 3–5 modules (or the budget in the Direction block). Detail behind a click.
- **Prove, don't claim.** Show the subject doing its job: the interface at work, the mechanism dramatized, specifics a competitor could not copy-paste.
- **Author the assets; never substitute chrome.** Great surfaces live on carefully made content: names, entries, copy, covers, thumbnails. Gradients, glass, generic icon tiles and many-vertex `clip-path` polygons where an authored asset belongs are the gap wearing chrome.
- **Use real imagery.** Real photographs with life in them, real product screenshots, real logos. Fully real or clearly stylised, never half-real. Verify image URLs resolve.
- **Build the form's web leverage.** When the chosen world names a technique (canvas, WebGL, view transitions), build the technique itself, not a static imitation.
- **One character detail that means something** (`references/base-taste.md` §3), not a decoration layer.
- **Motion as material, once.** Follow `references/motion-standard.md` and the motion dial: decide purpose, property, curve, duration, interruption and exit for each animation. Bound expensive effects and keep content visible by default.
- **Every interactive element answers:** hover (on pointer devices), press, focus, disabled, loading, error, empty.
- **Default output is a clickable local prototype** (the output dial). Production code only when the dial says so.

Preserve semantics, accessibility, performance, responsiveness, project conventions and working behavior.

## 7. Inspect and finish

1. **Self-review against the top reference.** Put a desktop and a phone screenshot next to the profile's top reference (from the context output). Ask honestly: would this hold up next to it? Does anything look like a template, a vibe layer or a close copy? Fix what fails before any gate runs.
2. **Gates.** Run lint and render (`references/gates.md`), and motion for every animation that matters. Fix what is mechanical. Drive every interaction and reachable state (open, closed, hover, focus, error, empty, overlong content) and check each for overlap and clipping, not only the resting screen.
3. **Hand back** to the Director: the artifact path, the screenshot folder, the flipbooks, the list of changes, and any gate that exited 2 ("not run"). The Director runs the critics. Two inspection rounds is your ceiling; after that, remaining findings travel to the critics, where a fresh context finds them better.
4. **Document** a new or replaced world: write DESIGN.md from the built result ([document.md](document.md)), describing what shipped, not what was intended.

A capture is evidence only when it is valid: settle or disable entrance motion before screenshots (an element hidden by animation timing reads as missing), capture full pages from the top, and open every file once to confirm it shows what its name claims.
