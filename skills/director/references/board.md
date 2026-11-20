# Board

A local page where the person looks at cards and rates them: ♥ or ✕, 1–5, and a one-line note. Ratings write into the deck folder, and reference ratings write into the profile.

## Deck file

`deck.json`, in its own folder (usually `.design/board/<round>/`), next to the files it shows:

```json
{
  "title": "Home directions",
  "kind": "concepts",
  "layer": "personal",
  "cards": [
    { "id": "a", "title": "Greeting and four calm modules", "src": "a/index.html", "why": "One big fact, details one click away" },
    { "id": "d", "title": "Reference: a quiet shop", "src": "https://shop.test", "image": "shots/d.png", "why": "Full-bleed photography, almost no chrome" }
  ]
}
```

| Field | Meaning |
|---|---|
| `kind` | `refs` (references to rate), `concepts` (our mockups), `dials` (pick one option per group), `blind` (titles hidden, Option A/B/…) |
| `layer` | For `refs`: where ♥/✕ references are saved (`personal`, `brand:<name>`, `project`) |
| `src` | A file path relative to the deck (html or image) or a URL |
| `image` | A screenshot to show for URL cards (most sites refuse to be framed). Make one with the render command |
| `why` | One line: what is good about it. Required for refs and concepts |
| `group` | For `dials`: the dial name. Each card is one option |

HTML concepts are shown as a live, scaled-down desktop view (1440 wide).

## Serve and read

- Start it in the background: `node <plugin>/scripts/cli.mjs board serve <deck.json>`. It prints a local URL; open it for the person (or give them the link).
- Read the results: `node <plugin>/scripts/cli.mjs board results <deck.json> --json`. Sorted by score, with ♥/✕ and notes.
- Ratings are in `ratings.jsonl` next to the deck (the last line per card wins).

## Writing good cards

- **References (Scout):** about 10 that span a real range (different compositions, moods, densities), not 10 versions of one look. Each `why` names one specific quality ("dims everything except the hovered row"). Prefer live product screens and real sites over shots.
- **Concepts:** 3 truly different directions at the chosen creativity level, plus 1 wild card a level higher. Show each inside the real product chrome when one exists; free-floating mockups land worse. Use real content.
- **Dials:** one group per dial being asked, each option rendered as a tiny version of the screen (real swatches, real type), pre-selected from the profile.
- **Blind:** used by evals. Titles and whys are hidden; never put the arm name in a file path the person can see.

## After rating

1. Read the results.
2. Say in two or three lines what won and why, in the person's terms ("the quiet one won again; you liked the dot, not the wash").
3. Save lessons (profiles.md) and update the contract.
4. Mix picks when the person mixes them ("C, with the week line from A").
