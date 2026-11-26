# Lane: Review

"What's wrong with this?" A ranked report with fixes. No edits unless the person asks.

## Steps

1. **Load** context and the contract if one exists. Note the time; a review takes real checks, not one quick read.
2. **Render** the target: `cli.mjs render <url or file> --out .apollo/render/review`. Run `cli.mjs lint` on its source if you have it, and `cli.mjs motion` on its main transitions.
3. **Critics in parallel. Never skip the critics**, even for a small page. Each gets screenshots, paths, the URL, the dials, the never-list and the contract (never the conversation):
   - **critic-slop**: AI tells, taste violations, the bold move.
   - **critic-motion**: smoothness and purpose of motion.
   - **critic-break**: worst-case data, themes, zoom, accessibility.
   - **critic-contract**: only when a contract exists.
   In lean mode, run one combined critic pass, but still run it.
4. **UX scoring.** Brief the **screens** agent to run its critique playbook (`screens critique`) for the heuristic scores (each heuristic 0–4, total out of 40, or the applicable maximum).
5. **Your own read** (after the critics, so you're not anchored first): compare against the top reference. Would it hold up? Where is the biggest gap?
6. **Report.** Use this structure every time, in this order:

   ```markdown
   Method: render at 390/768/1440 light+dark+200% zoom · lint · motion · critic-slop · critic-motion · critic-break · UX heuristics. Not run: <gate, why>.

   **Verdict:** two plain sentences.

   **Scores:** UX heuristics 14/40 · slop findings 11 (8 fail) · layout findings 3 · accessibility 4 · motion: smooth / 2 violations

   ## P0: must fix before anyone sees it
   1. <problem>: where (file:line or screenshot), why it matters in plain words, the concrete fix.

   ## P1: fix next
   …

   ## P2: polish
   …

   ## Keep
   - what already works and must survive the fixes.
   ```

   Rank by what the person would feel first. Every item has a location, a reason and a fix.
7. **Offer the next lane:** "Want me to fix the P0s? That's a Refine." Don't start without a yes.
