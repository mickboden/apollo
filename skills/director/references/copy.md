# Copy

Words are part of the design. Most AI-looking pages give themselves away in the copy before the layout.

## Rules

1. **Few words, specific and true.** Say the thing. "Three meetings today, one review due at four" beats "Stay on top of your day".
2. **Name concrete details instead of adjectives.** "The label leans in by 2px" is better than "delightful micro-interactions".
3. **No process talk in audience copy.** No rounds, labs, scores, iterations or "we tested eight ideas". That belongs to the team.
4. **No claims that aren't true.** If it was not handmade, don't say handmade. If there is no number, don't invent one.
5. **Sound like a person.** Short sentences. Sentence case. A little humour where the context allows; calmer on professional pages (a CV, a pitch).
6. **No filler subtitles.** A subtitle that repeats the title in more words is noise. Delete it and let the heading carry.
7. **No exclamation marks** in interface copy.
8. **Controls say what they do.** "Copy titles", not "Submit". Errors say what went wrong and how to fix it.

## Words that mark text as AI-written

The linter fails on these in markup (rule `filler-copy`): seamless, seamlessly, elevate, unlock, empower, effortless, effortlessly, supercharge, revolutionize, revolutionise, cutting-edge, game-changer, next-level, delve, unleash.

Also avoid: "in today's fast-paced world", "whether you're X or Y", "take it to the next level", "a testament to", "it's not just X, it's Y", "say goodbye to", "look no further", "harness the power of".

## Structure

- Headings: what it is, in as few words as possible.
- A lede, if any: one sentence with one concrete fact.
- Meta lines (author, date, reading time): one quiet line, never removed entirely if the person relies on it.
- Lists: parallel, short, no trailing period on fragments.

## Humanizer

If the `humanizer` skill is installed (find it with `cli.mjs locate humanizer`), run its pass over any audience-facing text longer than a paragraph before hand-over.

## Length

When the person says "too much text", cut by about a third, keep every concrete fact, and show it again. Do not cut the facts and keep the adjectives.
