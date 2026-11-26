# Upstream skills

Specialists use other skills when they are installed, by reading their files from disk. Base taste and the profile layers always win on conflict; the upstream skill supplies method and detail.

Find any skill with `cli.mjs locate <skill-name>`. It searches the specialists folder (`~/.claude/apollo-specialists`), `~/.agents/skills`, `~/.claude/skills`, and installed plugins. Exit 1 means it is not installed; fall back to this plugin's own references.

## Who uses what

| Specialist | Reads when present | Fallback |
|---|---|---|
| screens | the built-in `screens` skill (always), `design-taste-frontend` (references and library), `emil-design-eng`, `apple-design`, `mobile-native`, `pick-ui-library` | `screens` + base taste |
| motion | `animate`, `emil-design-eng`, `apple-design`, `animation-performance`, `review-animations`, `animate-expo` (React Native) | motion-standard.md |
| critic-break | `break-ui` | the break method in the critic's own brief |
| copy (any) | `humanizer` | copy.md |

## Phase-2 routes

These lanes route to upstream skills until their own specialists exist. In every case: run `cli.mjs context`, pass the merged context and dials to the work, and run the gates that apply.

| Work | Route | Gates |
|---|---|---|
| References and competitors (Scout) | Done inline by the Director: Mobbin MCP (`search_screens`, `search_flows`) if connected; otherwise Chrome or web browsing. Screenshot each with `cli.mjs render <url> --widths 1440 --themes light --zoom ""`, then build a `refs` deck | none (it is research); the board does the rating |
| Slides and slide masters | `pptx` skill (and `winston-talk` for talk structure) | one new idea per layout; render the exported deck pages; contract |
| Figma read/write | Figma MCP and its skills (`figma-use` before any write, `figma-design-to-code` before reading designs) | use library variables, not hard-coded values; contract |
| Isometric figures, explainer drawings | `anatomy` | anatomy's own checks; render; motion if animated |
| Images (generated or edited) | Figma image tools, `design-taste-frontend` assets | half-real check by critic-slop; licence and credit noted |

## Reading an upstream skill

1. `locate` it.
2. Read its `SKILL.md` and only the reference files that match the task.
3. Apply its method. Where it disagrees with base taste, the profile or the dials (for example a skill recommending blur transitions while the dial is calm), follow base taste and note the conflict in one line.
4. Never copy its text into this plugin or into the person's files.
