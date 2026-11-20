# Lane: Review

"What's wrong with this?" A ranked report with fixes. No edits unless the person asks.

## Steps

1. **Load** context and the contract if one exists.
2. **Render** the target: `node <plugin>/scripts/cli.mjs render <url or file> --out .apollo/render/review`. Run `cli.mjs lint` on its source if available, and `cli.mjs motion` on its main transitions.
3. **Critics in parallel**, each with screenshots, paths, the URL, the dials, the never-list and the contract (never the conversation):
   - **critic-slop**: AI tells and taste violations.
   - **critic-motion**: smoothness and purpose of motion.
   - **critic-break**: worst-case data, themes, zoom, accessibility.
   - **critic-contract**: only when a contract exists.
   In lean mode, one combined critic pass.
4. **Your own read** (after the critics, so you're not anchored first): compare against the top reference. Would it hold up? Where is the biggest gap? For a deep UX review, the screens agent can run its critique playbook (`screens critique`).
5. **Report**, ranked by what the person would feel first:
   - The verdict in two lines.
   - **Top 3 to fix**, each with where, why (in plain words) and the concrete fix.
   - Everything else, grouped (slop, motion, layout and data, accessibility, contract).
   - What already works and must be kept.
   - Gates that could not run, and why.
6. **Offer the next lane:** "Want me to fix the top 3? That's a Refine." Don't start without a yes.
