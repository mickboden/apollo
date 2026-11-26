# Changes from Impeccable 4.7.0

The `screens` skill is a modified fork of Impeccable's text (SKILL.md and reference/). The compiled `impeccable` binary is not included and not called.

- Removed the binary launcher: `context` now runs `cli.mjs context`, which also loads the stacked personal, brand and project profiles; the "launcher unavailable" branch is gone.
- Removed binary-only playbooks: live, live-setup, hooks, doctor, generate, visualize (comp-led builds), component-review, region-map, routing, craft (alias) and the degraded agent stubs. The Director's lanes, board and gates replace them.
- Replaced the design detector (`impeccable detect`) with `cli.mjs lint` (source) plus `cli.mjs render` (rendered layout checks) everywhere it was called, including critique Assessment B.
- Replaced critique storage (`critique-storage slug/write/trend/latest/close`) with plain Markdown snapshots in `.design/critiques/<slug>/` and a `status: open|closed` front-matter field.
- Rewrote new-work.md around the Director's flow: references rated on the board, 8–10 internal concepts cut to 3 truly different ones plus a wild card, concepts shown inside the real product chrome, the contract, host-first inventory, the density budget and a self-review against the profile's top reference. The dice-based concept seeding, decision page, build phases and comp measurement were removed.
- Colour strategy in new-work follows the colour dial (default neutral ground, ink and one accent) instead of defaulting to page-scale colour fields.
- craft-floor.md: the motion bullet now points to the motion standard and the motion dial (no blur, backdrop-filter or clip-path movement at calm); the hook sentence now points to the lint and render gates.
- animate.md, optimize.md and overdrive.md gained dial caveats: blur and filter motion only at expressive/showcase, stagger only for data reveals, overdrive only at creativity 4–5.
- layout.md and polish.md start from the density budget; critique.md and polish.md compare against the profile's top reference.
- init.md records workflow defaults in the Apollo project layer instead of `.impeccable/config.json`; live-mode setup removed.
- colorize.md, layout.md and typeset.md lost their live-mode parameter sections.
- `/impeccable <command>` references became `screens <command>`; `.impeccable/design.json` became `.design/design.json`.
