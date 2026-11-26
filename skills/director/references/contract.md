# Contract

The contract is the list of everything agreed. It is written before the build, kept up to date during it, and ticked line by line at hand-over by `critic-contract`. It is the cure for the most painful kind of correction: "where is the animation we agreed on?"

## Where

`.design/contract.md` in the project. One contract per project; a new round adds a dated section rather than rewriting history.

## Template

```markdown
# Contract

## Round 2026-11-20 · Home redesign

### Colours
- [ ] Ground: #F4F4F5 light / #131517 dark (from dials round)
- [ ] Team colour on the logo tile, identical in both themes (from concept C pick)

### Type
- [ ] Greeting 88px, two-tone, second line at 50% ink (from concept pick)

### Motion
- [ ] Opening: tile fills from the bottom in the team colour, ~280ms, once per session (from opening round)
- [ ] Card hover: 150ms background colour only

### Elements
- [ ] Exactly 4 modules: Today, People, Docs, Events (from density round)

### Copy
- [ ] Greeting reads "Good morning, <first name>." (from brief)

### Picks
- [ ] Concept C, with the week line from concept A (from concept rating)

### Out of scope
- Search (agreed to leave for later on 2026-11-20)

### Overrides
- render · `.cta × .nav overlap at 390` · the nav is fixed and the page pads 88px for it; the capture is mid-scroll (Director, round 2026-11-20)
```

## Rules

1. **Every line has an agreed value and a source** (which round, which pick, which message). Vague lines ("make it nice") are not contract lines.
2. **Nothing agreed is dropped.** If something cannot be built now, it moves to "Out of scope" *with the person's agreement*, never silently.
3. **Changes update the contract.** When the person changes their mind, edit the line and note the new source.
4. **Hand-over ticks every line** with evidence: a screenshot, a flipbook, a file and line. A missing line is reported first in the hand-over, in plain words.
5. **Agreed colours hold in every theme** unless the contract says otherwise.
6. **Overrides are written down.** Each gate finding the Director overrides gets one line under **Overrides**: the gate, the finding as reported, the reason, who and when. The same line goes into `cli.mjs progress override` and the hand-over. An override never covers something the person asked for (gates.md, "Overrides").
7. **Earlier versions can come back.** When a liked version is replaced, keep it reachable (a file, a branch, a toggle) until the person lets it go.
