# Apollo

**One front door for all design work in Claude Code.**

Ask for anything visual: a new page, a calmer button, an opening animation, "why does this look generic?", a stutter that needs fixing. Apollo picks the right lane, briefs specialist agents with **your** taste, and only hands over work that has passed measured checks: no AI tells, no layout breaks, smooth motion, nothing agreed left out.

```
you:    make the dashboard less generic
Apollo: Lane: Refine. Say if you meant something else.
        … 3 options on the rating board, each changing one thing …
        … build, then lint · render · motion · 4 independent critics …
        Gates: lint passed · render passed (phone, desktop, dark, 200% zoom) · motion passed · contract 9/9
```

---

## Contents

- [What you get](#what-you-get)
- [Requirements](#requirements)
- [Install](#install)
- [First run](#first-run)
- [Recommended: make Apollo the only design skill](#recommended-make-apollo-the-only-design-skill)
- [Using it](#using-it)
- [Profiles](#profiles)
- [The checks](#the-checks)
- [Updating and uninstalling](#updating-and-uninstalling)
- [Troubleshooting](#troubleshooting)
- [Privacy](#privacy)
- [Development](#development)
- [Credits and licence](#credits-and-licence)

---

## What you get

| | |
|---|---|
| **Lanes** | Every request goes into one lane, announced in one line: **Tweak** (one named change, one small step), **Refine** (options that each change one axis), **New** (brief → dials → rated references → 3 concepts + a wild card → contract → build → gates), **Explore** (references and directions, no build), **Fix** (measure, find the cause, fix, measure again), **Review** (four critics, report only), **Replicate** (rebuild a real UI 1:1 from measured values). |
| **Taste profiles** | An opinionated base taste ships with the plugin. Your personal profile, brand profiles and per-project layers stack on top, and learn from your ratings. |
| **Dials** | Creativity 1–5, colour, motion, density, type, imagery, output. Pre-set from your profile. |
| **Rating board** | A local page to ♥ / ✕ and score references and concepts 1–5. Your ratings flow back into your profile. |
| **Specialists** | `screens` (web, app and native UI, built on a modified fork of Impeccable) and `motion`. |
| **Critics** | Fresh agents that never saw the build: `critic-slop`, `critic-motion`, `critic-break`, `critic-contract`. |
| **Measured gates** | A slop linter, a real-Chrome render matrix, and real-browser motion measurement with flipbooks. |

Decks, Figma work, isometric figures and imagery currently route through upstream skills (see [Upstream skills](#upstream-skills)). Dedicated specialists for them are planned.

## Requirements

- **Claude Code** (CLI, desktop app or IDE extension) with plugin support.
- **Node.js 22 or newer** on your `PATH` (`node -v`). Nothing is installed from npm; everything runs on Node's standard library.
- **Google Chrome** (or Chromium) for the render and motion checks:
  - **macOS:** the standard `/Applications/Google Chrome.app` is found automatically.
  - **Linux:** `google-chrome`, `google-chrome-stable`, `chromium` or `chromium-browser` on your `PATH`.
  - **Anything else, or a custom install:** set `CHROME_PATH` to the browser binary.
  - **Containers, CI and hardened Linux** (no user-namespace sandbox, or running as root): Apollo retries Chrome with `--no-sandbox` by itself. Set `APOLLO_CHROME_NO_SANDBOX=1` to always use it, or `=0` to never.
  - **Without Chrome**, the plugin still works, but the render and motion gates report **not run**.
- **Optional:** the Mobbin and Figma MCP servers make reference research and Figma work richer.

## Install

### From GitHub (recommended)

```bash
claude plugin marketplace add mickboden/apollo
claude plugin install apollo@apollo
```

Or inside a Claude Code session:

```
/plugin marketplace add mickboden/apollo
/plugin install apollo@apollo
```

Start a new Claude Code session (or run `/reload-plugins`), then check it's there:

```bash
claude plugin details apollo
```

You should see 2 skills (`director`, `screens`) and 6 agents.

To check the machine can run every gate (Node, Chrome, profiles folder, plugin root), with a fix for anything missing:

```bash
node <apollo>/scripts/cli.mjs doctor
```

### From a local clone (to hack on it)

```bash
git clone https://github.com/mickboden/apollo.git
claude plugin marketplace add ./apollo
claude plugin install apollo@apollo
```

A local marketplace reads the folder directly, so your edits apply at the next session start.

## First run

Just ask for design work in any project, for example:

```
make the settings page feel calmer
```

Or call it directly with `/apollo:director`.

On first use, Apollo sees that you have no personal profile and offers to create one with three questions:

1. Which product or site is your quality bar?
2. Calm or bold by default, for product work and for showcase work?
3. Anything you never want to see?

You can skip this; the base taste then applies on its own. To set things up by hand, using the plugin's CLI (`<apollo>` is the plugin folder; see the note below):

```bash
node <apollo>/scripts/cli.mjs profile init personal        # ~/.design-profiles/personal/
node <apollo>/scripts/cli.mjs profile init brand acme      # ~/.design-profiles/brands/acme/
cd your-project && node <apollo>/scripts/cli.mjs project init --brand acme
```

`project init` creates `.design/` in your project and adds `.design/` and `.apollo/` to its `.gitignore`.

> **Where is `<apollo>`?** For a local clone, it's the clone. When installed from GitHub, it's in the plugin cache:
> `find ~/.claude/plugins -path "*apollo*/scripts/cli.mjs" | head -1`
> The Director and its agents find it themselves; you only need it for manual commands.

## Recommended: make Apollo the only design skill

If you have other design skills installed (Impeccable, design-taste-frontend, emil-design-eng, animate, apple-design, break-ui, review-animations and similar), they compete with Apollo for the same requests, and their rules can contradict each other. Move them aside so only Apollo answers. Its specialists still read them from disk and use their methods.

```bash
node <apollo>/scripts/cli.mjs migrate --dry-run   # show what would move
node <apollo>/scripts/cli.mjs migrate             # move them to ~/.claude/apollo-specialists/
node <apollo>/scripts/cli.mjs migrate --undo      # put them back exactly
```

Nothing is deleted, and running it twice does nothing. Restart Claude Code afterwards. `node <apollo>/scripts/cli.mjs locate <skill>` shows where any skill lives.

## Using it

Talk normally. Some examples, and the lane each one lands in:

| You say | Lane |
|---|---|
| "make the greeting a little bigger" | **Tweak:** one step on one property, old value kept |
| "this dashboard feels generic" | **Refine:** 2–3 options on the board, each changing one axis |
| "design the onboarding for our app" | **New:** brief, dials, references, concepts, contract, build, gates |
| "show me what's possible for a pricing page" | **Explore:** rated references and directions, no build |
| "the sidebar animation stutters" | **Fix:** measure, find the root cause, fix, measure again |
| "what's wrong with this page?" | **Review:** a ranked report from four critics, no edits |
| "rebuild the macOS Settings sidebar 1:1" | **Replicate:** measured values, real assets, then one twist |

Add **"lean"** or **"quick"** for a cheaper run: 2 concepts instead of 3 plus a wild card, no parallel agents, and one combined critic.

Apollo never pushes, deploys or publishes without an explicit go.

## Profiles

```
base taste        ships with the plugin
  └ personal      ~/.design-profiles/personal/         always on
      └ brand     ~/.design-profiles/brands/<name>/    optional, per client or company
          └ project   <project>/.design/                 this job only
```

Later layers override earlier ones. Each profile has these files:
- `profile.md`: front-matter for the dials, the never-list and your top reference, then Markdown for references, main decisions and brand values
- `refs.jsonl`: your rated references
- `lessons.md`: what Apollo has learned from your corrections

See [`profiles/example/`](profiles/example/) for a fictional personal and brand profile.

Set `APOLLO_PROFILES_DIR` to keep profiles somewhere other than `~/.design-profiles`.

To print the merged context for any project:

```bash
node <apollo>/scripts/cli.mjs context --project .
```

When you rate or correct something, Apollo saves the lesson to the right layer and tells you in one line ("Saved to personal: the quiet option won again"). Say "move it to project" or "undo" to change that.

## The checks

All checks are commands of the zero-dependency CLI. Exit codes: **0** clean, **1** findings, **2** could not run. A "could not run" is reported as **not run**, never as passed.

| Command | What it checks |
|---|---|
| `doctor` | Checks Node, that Chrome is found and launches (and whether it needed `--no-sandbox`), the profiles folder and the plugin root. Prints a fix for each problem; exits 1 on anything that blocks a gate. |
| `lint <files or folders>` | A merged slop list in CSS, HTML, JSX/TSX, Vue, Svelte, Astro and CSS-in-JS, including Tailwind classes. Catches beige grounds, gradient text, glowing dots, eyebrow labels, filler copy, placeholder data, overshoot easing, blur in motion and more. |
| `render <url or .html>` | Opens the page in real Chrome at 390, 768 and 1440 px wide, light and dark, plus 1440 at 200% zoom. Finds horizontal scroll, overflowing or overlapping text, and targets under 24px. Pages that return 4xx/5xx and unreachable targets are "not run". |
| `motion <url> --click <sel>` | Measures frame timing and every animated property, duration and easing against your motion dial (`still`, `calm`, `expressive`, `showcase`). Also runs a reduced-motion pass and writes a flipbook you can play at real speed. |
| `privacy <folder>` | Blocks emails, home paths, API keys, private Figma and preview URLs, and every word in `~/.design-profiles/private-denylist.txt`. Run it before publishing anything. |
| `board serve <deck.json>` | Starts the rating board. `board results <deck.json>` reads the ratings back. |

Run `node <apollo>/scripts/cli.mjs --help` for everything else (`context`, `profile`, `project`, `learn`, `migrate`, `locate`, `eval-deck`).

### Upstream skills

Apollo works on its own. When these are installed, its specialists read and apply them; base taste and your profile win on conflict:

- **screens:** design-taste-frontend, emil-design-eng, apple-design, mobile-native, pick-ui-library
- **motion:** animate, emil-design-eng, apple-design, animation-performance, review-animations, animate-expo
- **critic-break:** break-ui
- **copy:** humanizer
- **figures:** anatomy
- **decks:** pptx (and winston-talk for talk structure)
- **Figma:** the Figma MCP server and its skills
- **references:** the Mobbin MCP server

## Updating and uninstalling

To update:

```bash
claude plugin marketplace update apollo
claude plugin update apollo@apollo
```

To uninstall:

```bash
node <apollo>/scripts/cli.mjs migrate --undo     # only if you moved other design skills aside
claude plugin uninstall apollo@apollo
claude plugin marketplace remove apollo
```

Your profiles in `~/.design-profiles/` and your projects' `.design/` folders are yours; uninstalling doesn't touch them.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Gates say **"render not run: Chrome not found"** | Install Google Chrome, or set `CHROME_PATH=/path/to/chrome`. |
| **"start the dev server and pass its URL"** | Render and motion need a page. Start your app's dev server and pass `http://localhost:<port>/…`, or pass an `.html` file. |
| **"answered HTTP 404"** | The route doesn't exist on the dev server. Check the URL. |
| **"page did not finish loading in 30s"** | Something on the page never finishes loading (a font, a script, an API call). Check the dev server's console. |
| Apollo doesn't trigger | Start a new session after installing, or call `/apollo:director` directly. If other design skills grab the request, run the [migration](#recommended-make-apollo-the-only-design-skill). |
| Render and motion are "not run" inside `claude plugin eval` | Chrome can't start in the eval sandbox. That's expected; judge visuals from outputs rendered outside it. |
| You want to see where motion time goes | Run with `APOLLO_DEBUG=1` for phase timings. |

## Privacy

- Profiles, references and project layers never live inside the plugin.
- `project init` gitignores project layers (`.design/`) and check output (`.apollo/`).
- Before publishing anything, run `node <apollo>/scripts/cli.mjs privacy <folder>`.
- Put private names, companies, clients and domains in `~/.design-profiles/private-denylist.txt`, one per line. They're matched case-insensitively, also inside identifiers and file paths.
- Known-safe words that contain a denied one go in `~/.design-profiles/private-allowlist.txt`.

## Development

```bash
git clone https://github.com/mickboden/apollo.git && cd apollo
npm test                                   # node --test, no dependencies; Chrome tests skip without Chrome
node scripts/cli.mjs --help
claude plugin eval . --scaffold --allow-tools Bash Write Edit --runs 1 --no-publish
```

See [`AGENTS.md`](AGENTS.md) for the folder map and rules, and [`evals/README.md`](evals/README.md) for the blind A/B rating round.

Before every commit, run `npm test` and `node scripts/cli.mjs privacy .`. Never copy text from skills that have no licence; write your own words.

## Credits and licence

Apollo builds on:

- **Impeccable** by Paul Bakaus (Apache-2.0). The Screens core in `skills/screens/` is a modified fork; see [`NOTICE`](NOTICE) and [`skills/screens/CHANGES.md`](skills/screens/CHANGES.md).
- **Superpowers** by Jesse Vincent (MIT). The lane discipline, brainstorm-to-contract flow, verification gates and the rating-board idea are adapted from its process skills.

See [`CREDITS.md`](CREDITS.md). Licensed under the [Apache License 2.0](LICENSE).
