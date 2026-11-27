---
name: s2-02-editorial
tags: [creative]
runs: 1
max_turns: 120
timeout_seconds: 4500
---
Design a long-form editorial article published by "Breum & Co". Write a plausible article of at least 900 words. Output ./out/index.html.

This is an unattended evaluation run. Nobody will answer questions or rate a board. Where you would ask the person for facts, use the facts below. Every other decision (concept, direction, references, dials) is yours as the designer: make it and continue. Do not push, deploy or publish anything.

Facts:
- Brand: Breum & Co transports donor organs and blood between hospitals. It is the oldest business of its kind in the region. (Fictional.)
- Audience: hospital logistics leads.
- Main action: request a time-critical transport.
- Content to include: live transports, chain-of-custody steps and response times.
- Personality: warm and plain-spoken.

Output rules:
- One self-contained file, ./out/index.html, under 250 KB, with its CSS and JS inline.
- Fonts from Google Fonts only.
- Images only as inline SVG, CSS or data: URIs; no other image files and no links to images.
- Responsive from a 390px phone to a 1440px desktop.
