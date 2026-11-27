# Evals

Apollo is measured on two tracks.

| Track | Question it answers | Cases | Use it when |
|---|---|---|---|
| **Regression** | Is this Apollo better or worse than earlier Apollo? | The 8 fixed cases below, never edited | After any change to rules, lanes or agents, to compare against earlier rounds on exactly the same prompts |
| **Creative A/B** | Does Apollo beat no Apollo, across its whole range? | Fresh cases generated each round | To see what Apollo does with briefs it has never met, instead of the same eight things again |

Both tracks are judged on static, blind A/B sheets and recorded in a results ledger (`evals/ledger/<track>.jsonl`). Regression rounds compare Apollo with its own past through that ledger: same prompts, same baseline, one line per round.

## Regression track: the fixed cases

Eight cases from real kinds of design requests (names and brands are fictional). Each prompt carries pre-written answers, so runs need no live input. Do not change them: their value is that every round runs the same text.

| Case | Lane | Fixture |
|---|---|---|
| home-internal-app | New (lean) | no |
| opening-animation | New | no |
| slide-master | New | no |
| landing-hero | New | no |
| fix-stutter | Fix | `fixtures/site` |
| refine-more-vibey | Refine | `fixtures/site` |
| replicate-ui | Replicate | no (public page) |
| review-page | Review | `fixtures/site` (planted slop) |

## Automated graders

```bash
claude plugin eval . --scaffold --allow-tools Bash Write Edit WebFetch --runs 1 --no-publish
```

`--scaffold` copies each fixture site into the run's workspace. The default ablation also runs a no-plugin baseline arm.

## Creative A/B track: generated cases

```bash
node evals/creative/generate.mjs --seed 7 --count 5 --out <runRoot>-cases
```

Each case is composed from axes in `creative/axes.mjs`: artifact type (17 kinds, from pricing pages and dashboards to opening animations, emails, decks and data visualisations), an unusual domain (about 40, from rope-access window cleaning to subsea cable repair), an invented brand with a one-line premise, an audience, a personality and, for about half the cases, a constraint (type only, one colour, dark only, brutalist, 320px first…). About one case in four is Refine or Fix; those get a plain, deliberately generic starting page in `fixtures/site/`, and Fix pages have one planted problem (a stuttering panel, sideways scrolling on a phone, low contrast with tiny targets, or a headline running into a panel).

- Prompts give **facts only**: brand, audience, main action, content, personality, constraint. Concept, direction, references and dials are left to the designer. No pre-filled picks such as "creativity dial 4" or "the wild card, toned down one step"; round 1 showed those pull both arms toward safe output.
- Both arms get the same prompt text. Output rules match the round: one self-contained `./out/index.html` under 250 KB, Google Fonts only, images only as inline SVG, CSS or data: URIs, responsive from 390 to 1440px.
- The same seed always gives the same cases. `creative/history.json` records used brands and artifact + domain pairs; later seeds avoid them and spread across the least-used artifact types. Re-running a seed counts only the entries recorded before it (its own and later seeds' entries are ignored), so every committed batch reproduces even after later rounds. Use `--no-history` to ignore the file.
- Each case is `prompt.md` (with front matter) plus `case.json` (seed, lane, axes, motion plan, summary). `creative/examples/seed-1/` is a sample batch.

Run them with `run-blind.mjs --cases-dir <dir>`; everything after that is the same as the regression track.

## Blind rating (the real bar)

Runs happen outside the eval sandbox so Chrome works and both arms can check their own visuals.

```bash
node evals/run-blind.mjs <runRoot> [--cases-dir <dir>] [--cases a,b] [--concurrency 4]   # no --cases-dir: the regression cases
node evals/collect.mjs <runRoot>
node evals/sheets.mjs <runRoot>                     # one PNG per case in <runRoot>/sheets/, key in <runRoot>/sheets-key.json
# fill in <runRoot>/sheets/scores.md while looking only at the sheets
node evals/sheets.mjs --score <runRoot> [--label v0.2.0]   # reveals the key, tallies, appends to evals/ledger/<track>.jsonl
node evals/ledger.mjs trend [--track regression|creative]
```

- **new** arm: the installed Apollo plugin. **old** arm: Apollo's Skill tool blocked; the session follows Impeccable and design-taste-frontend read from disk (change with `--old-skills`). Install the plugin from the checkout you are measuring: `run.json` records that checkout's version and commit.
- `run-blind` copies the cases into `<runRoot>/cases/` and writes `<runRoot>/run.json` (track, commit, arms), so collect, sheets and the ledger know what was run.
- **Sheets** are static screenshots, because live previews were laggy to compare. Each sheet shows desktop 1440 on top and phone 390 below, A on the left and B on the right, with A and B shuffled per case. Pages are captured settled: scrolled through once so reveals fire, then left until their entrance animations finish. Motion cases (opening animations, micro-interactions, stutter fixes) show four frames over the recording and then the end state. Chrome comes from `CHROME_PATH` or the usual install places. Re-running `sheets.mjs` keeps the existing key and scores; `--reshuffle` draws new sides.
- Sheets work for any two arm folders in `<runRoot>/arms/`, so two Apollo versions can also be compared head to head on the regression cases; the ledger then records those arm names.
- The board (`scripts/cli.mjs eval-deck … --cases-dir <runRoot>/cases`, then `board serve`) still works for live, interactive comparison.

### Scoring

Per case: **winner** A, B or tie; optional **both-weak** when neither output is good; and **ship** yes or no: is the winner good enough to ship as it is? The ship answer is the absolute signal: round 1 showed that even winning outputs were not good enough, which a relative pick cannot show.

The score command prints each case with its arms revealed and a line such as `new won 4, old won 1, ties 0; both weak 1; new good enough to ship in 2/5`. "Good enough to ship" counts cases Apollo won or tied that were marked ship: yes.

Pass bar (a starting proposal; tighten it as rounds come in): Apollo wins at least 7 of 8 regression cases (or the same share of a creative batch), and at least half its cases are good enough to ship. Every miss is traced to a rule or a step, fixed, and re-run in a new round.

### The ledger

`evals/ledger/regression.jsonl` and `evals/ledger/creative.jsonl` get one line per scored round: date, label, Apollo version and commit, the arms, and the per-case results. `node evals/ledger.mjs trend` prints one row per round; the regression trend also prints each fixed case across rounds (W won, T tie, L lost, + good enough to ship, ! both weak), so a case that slips after a change stands out. Scoring the same run again replaces its line. `ledger.mjs add <runRoot>/sheets-result.json` re-adds a result by hand.

## Known limit

Chrome cannot start inside the `claude plugin eval` sandbox, so `render` and `motion` exit 2 there and runs report them as "not run" (correct behaviour). Automated graders therefore judge process and honesty; the visual bar is judged in the blind board round, from outputs rendered outside the sandbox.

Pilot (2026-11-20, home-internal-app, one run): 6/8 graders passed, $2.18, 32 minutes. Misses: `skill-fired` (run started before the skill was renamed to `director`) and `handover-format` (no "push only on go" line).

Round 1 (2026-11-20, all 8 cases, both arms, scored 1–5 on the board before the sheets and ledger existed): **failed**, new 2.0 vs old 2.8, new preferred in 0 of 8. Diagnosis: base taste had learned what to remove but not what to add (clean, forgettable output); openings too calm; review lane skipped critics and scoring; slide-master ran past its time; motion cases were indistinguishable as thumbnails. Fixes: base-taste §0 "The bold move", the brief-fit gate, opening defaults, a density structure floor, a structured Review lane, a time budget, load-time motion capture, flipbooks in the collector.
