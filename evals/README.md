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

Runs happen outside the eval sandbox so Chrome works and both arms can check their own visuals.

```bash
node evals/run-blind.mjs <runRoot> [--cases refine-more-vibey,opening-animation] [--concurrency 4]
node evals/collect.mjs <runRoot>
node scripts/cli.mjs eval-deck <runRoot>/arms/new <runRoot>/arms/old --out <runRoot>/deck
node scripts/cli.mjs board serve <runRoot>/deck/deck.json        # rate every pair 1–5
node scripts/cli.mjs eval-deck --score <runRoot>/deck
```

- **new** arm: the installed Apollo plugin. **old** arm: Apollo's Skill tool blocked; the session follows Impeccable and design-taste-frontend read from disk (change with `--old-skills`).
- Motion cases (fix-stutter, opening-animation) are shown as real-speed flipbooks, so a smoother panel or a catchier opening is visible on the board.

Pass: the new arm averages ≥4.0 and is preferred in at least 7 of 8 cases. Every miss is traced to a rule or a step, fixed, and re-run in a new round.

## Known limit

Chrome cannot start inside the `claude plugin eval` sandbox, so `render` and `motion` exit 2 there and runs report them as "not run" (correct behaviour). Automated graders therefore judge process and honesty; the visual bar is judged in the blind board round, from outputs rendered outside the sandbox.

Pilot (2026-11-20, home-internal-app, one run): 6/8 graders passed, $2.18, 32 minutes. Misses: `skill-fired` (run started before the skill was renamed to `director`) and `handover-format` (no "push only on go" line).

Round 1 (2026-11-20, all 8 cases, both arms): **failed**, new 2.0 vs old 2.8, new preferred in 0 of 8. Diagnosis: base taste had learned what to remove but not what to add (clean, forgettable output); openings too calm; review lane skipped critics and scoring; slide-master ran past its time; motion cases were indistinguishable as thumbnails. Fixes: base-taste §0 "The bold move", the brief-fit gate, opening defaults, a density structure floor, a structured Review lane, a time budget, load-time motion capture, flipbooks in the collector.
