# Evals

Eight cases from real kinds of design requests (names and brands are fictional). Each prompt carries pre-written answers, so runs need no live input.

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

## Blind rating (the real bar)

1. Collect each arm's outputs into one folder per arm, one sub-folder per case (screenshots, `index.html` or a flipbook).
2. `node scripts/cli.mjs eval-deck <new-arm-dir> <old-arm-dir> --out <deck-dir>`
3. `node scripts/cli.mjs board serve <deck-dir>/deck.json` and rate every pair 1–5.
4. `node scripts/cli.mjs eval-deck --score <deck-dir>`

Pass: the new arm averages ≥4.0 and is preferred in at least 7 of 8 cases. Every miss is traced to a rule or a step, fixed, and re-run in a new round.

## Known limit

Chrome cannot start inside the `claude plugin eval` sandbox, so `render` and `motion` exit 2 there and runs report them as "not run" (correct behaviour). Automated graders therefore judge process and honesty; the visual bar is judged in the blind board round, from outputs rendered outside the sandbox.

Pilot (2026-11-20, home-internal-app, one run): 6/8 graders passed, $2.18, 32 minutes. Misses: `skill-fired` (run started before the skill was renamed to `director`) and `handover-format` (no "push only on go" line).
