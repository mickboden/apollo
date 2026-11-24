# Base taste

The default eye. Every rule here comes from a real pattern: things a demanding designer corrected again and again after first proposals. Profiles override any rule (personal → brand → project); a pinned brief overrides everything.

Read this before every proposal. The goal is simple: **the first version should already land.**

## The bar

The target, in the words of the person this taste comes from: *artsy, cool, non-AI and special. You don't get exhausted by seeing too much. Simple but still complex, and you get excited staying on it. Clean and exciting animation. Strong, high-quality images.*

Before showing anything, ask: *would this hold up next to the profile's top reference?* If the honest answer is no, it is not ready.

## 0. The bold move

Restraint is how you frame the work, not the goal. The most common way this taste fails is clean, safe, forgettable output: everything removed, nothing added. That reads as "awful" as surely as clutter does.

1. **Every surface has one bold, ownable move.** Pick exactly one, make it unmistakable, and give it the room the calm frame creates:
   - a hero line set very large, maybe two-tone, that says something specific;
   - a real photograph or product shot at full bleed;
   - one confident colour field that means something (whose space this is, what state it's in);
   - a signature interaction or motion people will describe afterwards (a fill, a draw-on, a typed question that cuts to the page);
   - an unexpected but honest layout idea from the product's own material.
2. **The memory test.** Someone looks for five seconds and leaves. What would they describe an hour later? If the honest answer is "it was clean", the move is missing. Add it before showing anything.
3. **A refine that only removes is a failed refine.** Cutting clutter is half the job; the other half is adding the move. "More vibey", "less generic" and "more premium" always need something *added*: character, a moment, a real image, a point of view.
4. **Quiet frame, one loud moment.** Chrome, secondary text, borders and working-UI motion stay calm, so the one move has all the energy. Calm everywhere with no moment is not premium; it's unfinished.
5. **Meet the brief's words.** If the person asked for vibey, catchy, exciting, premium, bolder or calmer, the result must visibly be that, judged by a fresh critic (the brief-fit gate in gates.md). "Cleaner but not yet vibey" is a fail, not a hand-over.

## 1. Density and hierarchy

1. **Set an information budget.** One hero element plus 3–5 modules of 2–3 items each. Everything else goes behind a click or onto a detail page. *Why:* too much on screen was the single most common correction; overload turns people off before they read a word.
2. **Sparse is not empty.** Keep enough real data that it still reads as data. When feedback says "too much", remove what was named, not everything nearby. *Why:* cutting too far got corrected too ("too few information", "looks like an empty template").
3. **One big fact per screen.** A greeting, a number, a title: one element is allowed to be large (40–88px). Everything else stays on a compact UI scale. *Why:* growing one element and shrinking the rest is the change that landed most.
4. **Cap type sizes.** At most 5 sizes per page and 3 per card. Negative tracking on display text. *Why:* hierarchy comes from a few clear steps, not many small ones.
5. **Fit the amount to the viewer.** A team member sees less than a lead; a newcomer must understand it without being told. Detail on click, never on hover. *Why:* hover is for feedback and preview; real detail must be deliberate.
6. **Dense product chrome runs small.** First proposals tend to be 1–3px too small in sidebars, labels and icons. Check sizes against the host product. *Why:* "icons and text a little too small" came back more than once.

## 2. Colour

7. **Neutral ground, ink, one accent.** A cool light grey or white ground, near-black ink (never pure black), and one accent used for actions or meaning. *Why:* every project ended here, whatever it started with.
8. **Colour must mean something.** Identity, perspective, state. A tile's colour can tell you whose view you're in; a dot can say "staffed". Decoration alone is not a reason. *Why:* the colour details that were praised all carried meaning.
9. **No beige, no washes.** No warm-paper grounds, no tinted card fills, no gradient vibe layers. *Why:* they were rejected every single time they were tried.
10. **Identity colours stay identical in light and dark.** Don't darken agreed colours for dark mode. *Why:* changed colours in dark mode read as "not what we agreed".
11. **Dark full pages are a choice, not a default.** Use dark when it is the stage of the piece (an opening, a showcase), not as a mood. *Why:* dark pages felt "a little too drastic" when they weren't the point.

## 3. Character

12. **Character comes from one small detail that means something.** A logo tile that fills with the team colour while the AI writes. A label that leans in by 2px. A dissolve in the document's own colour. One or two per surface. *Why:* this is what made work feel "vibey" and crafted. A global style layer never did.
13. **Calm treatments, never a blank page.** When two treatments of the *same* move compete, the calmer one usually wins: a dot over a wash, a rise over a splash, a fade over a slide. That's about how a move is executed, not about having no move. *Why:* premium reads as calm; empty reads as unfinished.
14. **Showcase pieces go further.** Personal sites, case studies and openings get creativity 4–5 from the first proposal. Bold, unexpected and still smooth. *Why:* showcase work was repeatedly called "too simple" and "low animations".

## 4. Imagery and depth

15. **Use real things.** Real photographs (subjects with life in them), real product screenshots, real logos, real system icons. Never an icon standing in for the thing itself. *Why:* "the photograph is the interface"; hand-drawn stand-ins were rejected.
16. **Fully real or clearly stylised, never half-real.** A CSS imitation of water, a semi-realistic 3D laptop: these fail. Either convincing (real footage, believable physics) or deliberately graphic. *Why:* half-real looked "awful" and "unreal".
17. **Flat by default.** No shadows on cards, no rotated badges, no 3D tilt. Depth is reserved for the single interactive hero object, where flat would look cheap. *Why:* decoration was stripped in almost every project; the one exception was an interactive centrepiece.

## 5. Fidelity and host

18. **Native first.** Inside an existing product, a new page must look like it was always there: the same tokens, components, spacing and colour logic. A new look only comes with an explicit twist on the creativity dial. *Why:* "doesn't look like the app at all" was a hard reject.
19. **When rebuilding a real UI, measure it.** Computed styles, real font weights (450 is not 400), icon box sizes, real assets. Match it 1:1, then add one honest twist. *Why:* eyeballed replicas were rejected until they were measured.
20. **Don't redesign what already works.** If the reference product's send button, picker or mention menu is good, keep it. *Why:* "re-invented" versions of solved components scored 1 out of 5.
21. **Feel can beat measurement.** If the person prefers a slightly different size than the measured one, theirs wins. Note it in the project layer.

## 6. Interaction

22. **Everything answers the pointer.** Hover, press and focus states on every interactive element; a visible response on click. *Why:* a first build with no hover states read as unfinished.
23. **Errors stay.** Red, with the reason and a way to dismiss. Never a soft message that fades away. *Why:* disappearing errors were called out explicitly.
24. **Honest states.** A "thinking" indicator stops when the words arrive. Effects that fake a state are worse than none.
25. **Confirm only what's risky.** Bulk or destructive actions get a confirmation; a single, reversible action does not.

## 7. Working with the person

26. **Restate an ambiguous request in one line.** Name the element and the property you'll change. Change only that. *Why:* "that's not what I meant" came up in many sessions.
27. **Tune in small steps.** "A little bigger" means one step on one property (≈15–25%), keeping the previous value so it can come back. *Why:* big jumps were called "drastic" and "crazy prominent".
28. **Never drop what was agreed.** Every agreed colour, motion, element and copy line is in the contract and gets built, or the gap is flagged loudly at hand-over. *Why:* silently deferred colours and animations were among the sharpest corrections.
29. **One new idea per layout.** When a style is liked and must extend to more pages, each page gets its own idea in that spirit. Never paste the liked treatment onto everything. *Why:* pasted treatments looked "awful"; distinct ideas in the same spirit landed.
30. **Read metaphors as moods.** "Like a painting" means special but not too much. Ask when unsure. *Why:* a literal painting was rejected; the mood was the point.
31. **Real content only.** No sample people, no fake events, no claims that aren't true.
32. **Let them touch it.** A clickable local prototype beats static frames. Push or deploy only on an explicit go.
33. **Ask about taste, decide engineering.** Questions are welcome when the answer changes the look or the feel. Technical choices are yours.
