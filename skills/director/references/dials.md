# Dials

Seven dials set how a project looks and behaves. Base defaults sit in base taste; the personal, brand and project layers override them (`cli.mjs context` prints the merged values).

**When they are asked:**
- **New and Explore lanes:** show the dials pre-set on the board (a `dials` deck, one group per dial). The person changes only what differs, or says go.
- **Tweak, Refine, Fix, Review and Replicate lanes:** never ask. Use the project's values.

Save a changed dial to the project layer (`.design/project.md`, `dials:`), not to the personal profile, unless the person says it applies everywhere.

## creativity (1–5, default 3)

| Value | Output |
|---|---|
| `1` Faithful | Stays inside the existing system. No new patterns. |
| `2` Refined | The existing system, polished: better hierarchy, spacing, states. |
| `3` Distinct | On-system plus one deliberate twist that people will remember. Default for product work. |
| `4` Bold | A new idea in composition or interaction; still recognisably the brand. Default for showcase work. |
| `5` Out there | Unexpected on purpose. One concept may break category rules. Still smooth, still real content. |

In an Explore or New round, the three main concepts sit at the chosen level; the wild card goes one level higher.

## colour (default `neutral-accent`)

| Value | Output |
|---|---|
| `brand-exact` | Use the brand profile's tokens exactly. Nothing invented. |
| `neutral-accent` | Neutral ground, near-black ink, one accent for action. Further colours only to encode meaning. |
| `two-tone` | Two brand colours share the stage (for example ink and one strong colour in large fields), still no washes. |
| `expressive` | A richer palette, built from the references and brand, each colour with a job. For campaigns and showcase pieces. |
| `dark-stage` | A dark ground as the deliberate stage (openings, showcases, media-heavy pages), with light ink and one accent. |

Colour proposals always come from the references and brand tokens, never from nothing. On the dials board, each colour option is shown as real swatches applied to a small version of the screen.

## motion (default `calm`)

`still`, `calm`, `expressive`, `showcase`. Exact limits in motion-standard.md; the motion gate enforces them.

## density (default `balanced`)

| Value | Output |
|---|---|
| `sparse` | One hero plus 2–3 modules. Editorial, showcase, first-run screens. |
| `balanced` | One hero plus 3–5 modules of 2–3 items. The default. |
| `dense` | Tables and lists for people who work in the screen all day; still one clear first thing. |

## type (default `brand`)

| Value | Output |
|---|---|
| `system` | The platform UI font, compact scale. For tools and replicas of native apps. |
| `brand` | The brand profile's fonts and weights. |
| `editorial` | One display face for a single hero line, a calm text face for the rest. Never display type everywhere. |

## imagery (default `real-photos`)

| Value | Output |
|---|---|
| `ui-only` | No imagery beyond the interface itself and real screenshots. |
| `real-photos` | Strong real photography and real product screenshots. |
| `stylised` | A deliberate graphic style (flat illustration, diagrams). Never half-real. |
| `3d` | Real 3D renders or convincing physical objects. Only when it can be fully convincing. |

## output (default `prototype`)

| Value | Output |
|---|---|
| `mockup` | Static HTML mockups for the board. Fast, for deciding. |
| `prototype` | A clickable local prototype with real states. The default: people want to touch it. |
| `production` | Code in the project's stack, ready to commit. Push or deploy only on an explicit go. |
