# Profiles

Taste stacks in layers. Each layer overrides the one before it, per rule.

```
base taste      this plugin · the default eye · public
  └ personal    <profiles root>/personal/         always on
      └ brand   <profiles root>/brands/<name>/    optional, 0..n per project
          └ project  <project>/.design/            this job only
```

The profiles root is `~/.design-profiles`, or `$APOLLO_PROFILES_DIR` if set. It never lives inside this plugin.

## Files

| Layer | File | Holds |
|---|---|---|
| personal / brand | `profile.md` | Front-matter: `kind`, `name`, `topReference`, `dials`, `never` (slop-rule ids). Body: References, Main decisions, Never, Brand values (brand only) |
| personal / brand / project | `refs.jsonl` | One reference per line: `{src, title, love, score, why, at}`. The board appends here (project: `.design/refs.jsonl`) |
| personal / brand | `ratings.jsonl` | Raw rating history, append-only |
| personal / brand / project | `lessons.md` | `- YYYY-MM-DD · <rule> — <evidence>` lines |
| project | `.design/project.md` | Front-matter: `brands: [..]`, `dials`, `topReference`. Body: what the project is, who uses it, what success looks like |
| project | `.design/contract.md` | See contract.md |
| project | `.design/board/` | Decks and their ratings for this project |
| root | `suggested-base.md` | Lessons that look universal. Local only; never auto-published |
| root | `private-denylist.txt` | Words the privacy scan blocks (names, companies, clients, domains) |

## Commands

- `node <plugin>/scripts/cli.mjs context --project <dir>` (add `--json` for machines): the merged result. Run it at the start of every session.
- `profile init personal` / `profile init brand <name>`: create a profile.
- `project init --brand <a,b>`: create the project layer. It adds `.design/` to `.gitignore` unless `--commit` is passed.
- `learn --layer <layer> --rule "<rule>" --evidence "<what happened>"`: save a lesson.

## Where a lesson goes

After every rating, pick or correction, decide which layer the lesson belongs to:

| The lesson is about… | Layer |
|---|---|
| This project only (a pick, a size, a copy line) | `project` |
| The brand (its colours, its components, its voice) | `brand:<name>` |
| The person's taste across brands (density, motion feel, what they always reject) | `personal` |
| Something that seems true for everyone | `suggest-base` |

Then confirm in one line, exactly like this: **"Saved to personal: exits faster than entrances."** The person can say "move it to project" or "undo".

Do not save lessons for every small thing. Save when the person corrected something, rated a set, or said "always" or "never".

## First run

If `context` reports no personal profile, offer to create one with at most three questions:
1. Which product or site is your quality bar? (sets `topReference`)
2. Calm or bold by default, for product work and for showcase work? (sets `dials.motion`, `dials.creativity`)
3. Anything you never want to see? (fills `never` and the Never section)

Then, when a project belongs to a brand, offer `profile init brand <name>` and ask for its tokens, fonts, logo files and two or three reference links.

## Privacy

- Never copy profile content into the plugin folder, a public repo, or a published page.
- Brand values stay in the brand profile; they are not base taste.
- Before publishing anything, run the privacy scan.
