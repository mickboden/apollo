# Density

Too much on screen was the most frequent correction. Too little was the second. This file is how to land in between on the first try.

## The budget

For an overview, home or dashboard screen:

| Part | Amount |
|---|---|
| Hero | Exactly one: a greeting, the key number, the current state |
| Modules | 3–5 (4 is the sweet spot) |
| Items per module | 2–3, each with a real value |
| Actions per module | At most one primary action |
| Type sizes per page | At most 5 |
| Type sizes per card | At most 3 |

For a detail page, the budget is per section: one heading, one primary fact, then the rest in order of use.

Write the budget into the contract before building. If a requirement does not fit, it goes behind a click (a detail page, an expandable row, a drawer), not into a smaller font.

## Role-based amounts

Ask, or infer from the project layer, who looks at the screen:

- **Newcomer or general member:** the hero plus 3 modules. No jargon, no internal codes.
- **Regular user or lead:** the hero plus 4–5 modules, denser rows, small secondary numbers.
- **Admin or planner:** may add one dense table, still capped at about 4–6 columns, with details per row on click.

Same app, same look, different amount. A view for a different role should never look like an empty template; keep the structure and reduce the content.

## Click for detail, hover for feedback

- Hover may preview (dim the others, lift an icon, show a tooltip with one fact).
- Real detail (a breakdown, a history, how a score was built) opens on click.
- Never hide information that is needed to decide behind hover; touch screens have none.

## Sparse-not-empty check

Before hand-over, for each module ask:

1. Does it show a real value, not just a label and an icon?
2. Would a first-time viewer know what to do with it?
3. If it were removed, would anyone miss it? (If not, remove it.)
4. Is there anything here twice? (Merge it.)

A module that is empty *because the data does not exist yet* stays (with one quiet line). Emptiness today is not a reason to cut a feature.

## Hierarchy rules

- One element may be large (40–88px). Everything else lives on a compact UI scale (11–17px body, about 24px page titles).
- Two-tone headlines (the last word or second line at about 50% ink) are a good way to make a large line calmer.
- Labels: 11–12px, uppercase only if the product already does it, with letter-spacing .08–.12em.
- Numbers in tables and stats: tabular figures.
- Wrap text rather than truncate. Raise breakpoints for two-column layouts (about 1180px) when the product is often used zoomed in.

## When the person says "too much"

Remove what they named, keep what they liked, and show the result. Do not swing to an empty screen. When they say "too plain", add back *information*, not decoration.
