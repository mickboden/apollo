# Apollo

An all-in-one design plugin for Claude Code. One user-facing skill (the Director) reads a design request, picks a lane (Tweak, Refine, New, Explore, Fix, Review, Replicate), briefs specialist agents with the user's stacked taste profile, and only hands over work that passed measured gates (slop lint + critic, render matrix, motion measurement, break, contract).

## Folder map

| Path | What it is |
|---|---|
| `.claude-plugin/` | Plugin manifest and a one-plugin local marketplace for installing |
| `skills/director/` | The entry skill and its references (base taste, slop list, motion standard, lanes…) |
| `skills/screens/` | Screens core, a modified fork of Impeccable 4.7.0 (Apache-2.0) |
| `agents/` | Specialist and critic agents |
| `scripts/cli.mjs` | Zero-dependency Node CLI: context, profile, project, learn, lint, render, motion, privacy, board, migrate, locate, eval-deck |
| `board/` | Local rating board (♥ / ✕ / 1–5 / note) |
| `evals/` | Fixed regression cases (`claude plugin eval` + blind rounds), the creative case generator (`evals/creative/`), blind A/B sheets and the results ledger (`evals/ledger/`); see `evals/README.md` |
| `profiles/example/` | A fictional public sample profile |

## Run

- Tests: `npm test` (= `node --test "test/**/*.test.mjs"`) (Node ≥22; Chrome tests skip when Chrome is missing)
- CLI help: `node scripts/cli.mjs --help`

## Rules

- **Privacy:** no private names, companies, emails, private URLs or home paths in package files. Private profiles live in `~/.design-profiles/` (or `$APOLLO_PROFILES_DIR`). Run `node scripts/cli.mjs privacy .` before any publish.
- **Licences:** never copy text from unlicensed skills; write our own words. Impeccable-derived files keep the NOTICE.
- Run `npm test` and `node scripts/cli.mjs privacy .` before every commit.
