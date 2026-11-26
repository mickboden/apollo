# Slop list

One list, one source: `scripts/lib/slop/rules.json`. The linter checks rules marked `lint` or `both` in source code; `critic-slop` checks rules marked `critic` or `both` on screenshots. A profile's `never:` list can raise any rule to a hard fail, and the brief can earn any rule back (except where the rule says otherwise).

### beige-ground

**Beige or warm-paper ground** · fail · checked by lint and critic

Why: Warm beige grounds are the most common AI-template tell and read as generic, not crafted.

Instead: A cool neutral ground (light grey or white) with near-black ink. Warmth, if wanted, comes from photography and one accent.

### gradient-text

**Gradient text** · fail · checked by lint and critic

Why: Gradient-filled headlines are decoration; emphasis comes from size or weight.

Instead: Solid ink. Emphasis from size, weight, or a two-tone line (second half at ~50% ink).

### side-stripe

**Coloured side stripe** · fail · checked by lint and critic

Why: A thick coloured border-left on cards or callouts is an unexplained decoration.

Instead: No stripe. If the item needs a category, use a small coloured mark or a word.

### overshoot-easing

**Overshoot or bounce easing** · fail · checked by lint and critic

Why: Bounce reads as cheap in working UI; the calm curve wins every time.

Instead: `cubic-bezier(.22,1,.36,1)` to enter, `cubic-bezier(.65,0,.35,1)` to move. Springs only for platform replicas or showcase.

### blur-motion

**Blur in motion** · fail · checked by lint and critic

Why: Blur and smear on transitions feel hectic and confusing, not premium.

Instead: An opacity crossfade or a hard cut. Blur only as a static material, never as movement in working UI.

### slide-swap

**Sliding content swap** · warn · checked by lint and critic

Why: Content that slides in during view changes shifts the picture; use a fade or a cut.

Instead: Fade or cut between views. Movement is reserved for showing where something went.

### transition-all

**transition: all** · warn · checked by lint

Why: Animates properties nobody chose, including layout; name the properties.

Instead: List the exact properties: `transition: background-color 150ms, transform 120ms`.

### outline-removed

**Focus outline removed** · warn · checked by lint

Why: Removing the outline without a visible replacement leaves keyboard users lost; it is also how rings end up clipped or square on rounded rows.

Instead: Keep a `:focus-visible` ring that follows the shape: `outline: 2px solid var(--accent); outline-offset: 2px` (the outline takes the element's border-radius). Inside `overflow: hidden` containers, use an inset ring (`outline-offset: -2px`) so it is not clipped. Hide it only for pointer focus with `:focus:not(:focus-visible)`.

### pulse-glow

**Pulsing, glowing or shimmering decoration** · fail · checked by lint and critic

Why: Glowing and running dots look like AI slop and pull attention for nothing.

Instead: A static dot, or a state shown once. If something is live, say so in words.

### pure-black-ink

**Pure black text** · warn · checked by lint

Why: Pure black on light grounds is harsh; use a near-black ink.

Instead: A near-black ink token (for example a very dark cool grey).

### hard-offset-shadow

**Hard offset shadow** · fail · checked by lint and critic

Why: Zero-blur block shadows are a costume unless the whole world is neobrutalist.

Instead: No shadow, or a soft real one: an offset with a generous blur and low opacity.

### eyebrow-label

**Eyebrow or kicker label** · fail · checked by lint and critic

Why: A small label above every heading is template filler; the heading carries itself.

Instead: Delete the label. The heading carries itself.

### filler-copy

**Filler marketing words** · fail · checked by lint and critic

Why: Words like 'seamless' and 'elevate' say nothing and mark text as AI-written.

Instead: One concrete fact. See copy.md.

### placeholder-data

**Placeholder data** · fail · checked by lint and critic

Why: Fake names and lorem ipsum make a design look unfinished; use real content.

Instead: Real content from the project, or realistic content written for it.

### emoji-icon

**Emoji as icon** · warn · checked by lint and critic

Why: Emoji standing in for an icon system look improvised; use one drawn icon set.

Instead: One drawn icon set with a single stroke weight.

### card-wash

**Tinted card washes** · fail · checked by critic

Why: Colour-washed cards were rejected every time; colour belongs on small meaningful marks.

Instead: White (or surface) cards on the neutral ground. Colour as a small meaningful mark: a tile, a dot, a word.

### vibe-layer

**Global vibe layer** · fail · checked by critic

Why: Gradients, tints, strips and glows applied everywhere replace character with decoration.

Instead: One small detail that means something (base-taste.md §3), applied where it carries information.

### accent-overload

**More accents than meanings** · fail · checked by critic

Why: Each colour must encode something; extra accents make the page loud and unclear.

Instead: One accent for action. Further colours only where each encodes a category, state or identity.

### dark-page-default

**Very dark full pages by default** · warn · checked by critic

Why: Dark full pages feel drastic unless dark is the deliberate stage of the piece.

Instead: Light by default. Dark only as the deliberate stage (an opening, a showcase) or a real dark theme.

### serif-italic-display

**Half-italic serif headline as default voice** · fail · checked by critic

Why: The beige-plus-italic-serif header is the signature of template output.

Instead: The product's own type. If a display face is wanted, one confident face used once.

### display-everywhere

**Display type everywhere** · fail · checked by critic

Why: Big type works once, as the single hero move; repeated, it becomes decoration.

Instead: One hero line at display size; everything else on the compact UI scale.

### giant-uppercase

**Giant uppercase headings** · warn · checked by critic

Why: Shouting headings flatten hierarchy and feel dated.

Instead: Sentence case with negative tracking.

### orbit-diagram

**Orbit or solar-system diagram** · fail · checked by critic

Why: Circles orbiting a logo explain nothing; show the real system.

Instead: Show the real system: before and after, what it replaced in grey with lines into the new thing, real counts.

### sparkles

**Sparkles and stars** · fail · checked by critic

Why: Sparkle icons signal 'AI' instead of showing value.

Instead: Show what the AI actually does with a real example.

### colour-strips

**Decorative colour strips** · fail · checked by critic

Why: Thin colour strips on cards are decoration without meaning.

Instead: Nothing. Or a meaningful mark that encodes a real category.

### cursor-ring

**Custom cursor rings** · fail · checked by critic

Why: Cursor followers add motion nobody asked for.

Instead: The system cursor plus good hover states on the things that matter.

### decorative-tilt

**3D tilt as decoration** · fail · checked by critic

Why: Tilt-on-hover moves the picture without telling anything.

Instead: Flat and upright. Depth only for the one interactive hero object.

### shadow-everywhere

**Shadows on every card** · warn · checked by critic

Why: Flat by default; depth is reserved for the one interactive hero object.

Instead: Flat cards on a contrasting ground. A soft shadow only on floating layers (menus, sheets, a floating bar).

### rotated-badge

**Rotated badges and tags** · warn · checked by critic

Why: Tilted stickers read as costume; keep elements upright and flat.

Instead: An upright, flat label in the product's type.

### default-selectors

**Default-looking selectors, chips and badges** · fail · checked by critic

Why: Stock option pickers and badges look 'done fast'; give them the product's own form.

Instead: Controls drawn in the product's own form: its radii, its type, its states. Check them against the top reference.

### same-size-card-grid

**Same-size icon + heading + text card grid** · fail · checked by critic

Why: The lazy page structure; it says nothing about what matters most.

Instead: A composition with a clear first thing: one hero, then modules of different weight.

### hero-metric-template

**Hero-metric template** · warn · checked by critic

Why: Big number, small label, three supporting stats is a template, not a decision.

Instead: Lead with the one fact that matters to this viewer today, in a sentence if possible.

### process-meta

**Process talk in audience copy** · fail · checked by critic

Why: Rounds, labs, scores and 'we tested' belong to the team, not the audience.

Instead: Say the outcome. Keep the process in the project notes.

### inflated-claims

**Inflated or untrue claims** · fail · checked by critic

Why: Claims that aren't true or can't be shown break trust instantly.

Instead: Only claims you can show. Specific beats superlative.

### assistant-phrasing

**Generic assistant phrasing** · fail · checked by critic

Why: Stock AI sentences make copy sound machine-made; write like a person.

Instead: Rewrite like a person talking to a colleague. Run humanizer if installed.

### filler-subtitle

**Filler subtitles** · fail · checked by critic

Why: A subtitle that repeats the title in more words adds noise.

Instead: Delete it, or replace it with one concrete fact.

### icon-standin

**Icons standing in for the real thing** · fail · checked by critic

Why: Show the real product, screenshot or photo instead of a symbol for it.

Instead: A real screenshot, photo or logo of the actual thing.

### half-real-imagery

**Half-real imagery** · fail · checked by critic

Why: Realism must be fully convincing or clearly stylised; the middle looks cheap.

Instead: Go fully real (footage, photography, real physics) or clearly stylised (flat graphic). Never the uncanny middle.

### close-copy

**Close copy of one reference** · fail · checked by critic

Why: Copies of one admired site read as cheap; recombine several in the product's own material.

Instead: Take one trait from each of several references and rebuild it in the product's own material.

### pasted-treatment

**Liked treatment pasted everywhere** · fail · checked by critic

Why: Repetition kills what made the liked page special; each layout gets its own idea.

Instead: Name what made the liked page work, then give each new page its own idea in that spirit.

### no-signature-move

**No bold, ownable move** · fail · checked by critic

Why: Clean but forgettable: everything removed, nothing added. Without one memorable move the surface reads as unfinished, not premium.

Instead: Add exactly one move from base-taste.md §0 (a big specific line, a real photo, a meaningful colour field, a signature motion, an honest layout idea) and give it the room the calm frame creates. Apply the memory test.
