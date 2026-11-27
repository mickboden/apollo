---
name: s2-05-email
tags: [creative]
runs: 1
max_turns: 120
timeout_seconds: 4500
---
Design an HTML email "Beame Studio" sends to its customers. Output ./out/index.html.

This is an unattended evaluation run. Nobody will answer questions or rate a board. Where you would ask the person for facts, use the facts below. Every other decision (concept, direction, references, dials) is yours as the designer: make it and continue. Do not push, deploy or publish anything.

Facts:
- Brand: Beame Studio tests soil carbon for farmers selling carbon credits. Its founder is a retired engineer. (Fictional.)
- Audience: regenerative farmers.
- Main action: order a sampling kit.
- Content to include: how sampling works, results by field and lab accreditation.
- Personality: theatrical.

Output rules:
- One self-contained file, ./out/index.html, under 250 KB, with its CSS and JS inline.
- Fonts from Google Fonts only.
- Images only as inline SVG, CSS or data: URIs; no other image files and no links to images.
- Responsive from a 390px phone to a 1440px desktop.
- Build it the way a real HTML email is built (tables and inline styles, at most 600px wide), shown centred in the page.
