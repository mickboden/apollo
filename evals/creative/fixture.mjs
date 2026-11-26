// A plain, deliberately generic starting page for Refine and Fix cases, built from the case's facts.
// Fix cases get one planted problem (see DEFECTS in axes.mjs).
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const BASE_CSS = `
  body { margin: 0; font: 15px/1.5 system-ui, sans-serif; background: #F4F4F5; color: #1A1C21; }
  header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: #fff; border-bottom: 1px solid #E4E4E7; }
  header nav a { margin-left: 16px; color: inherit; text-decoration: none; }
  main { max-width: 1120px; margin: 0 auto; padding: 32px 20px; }
  h1 { font-size: 32px; margin: 0 0 12px; }
  .hero { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: center; margin-bottom: 32px; }
  .hero .media { background: #E4E4E7; border-radius: 12px; aspect-ratio: 4 / 3; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
  .card { background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #E4E4E7; }
  .card h2 { font-size: 16px; margin: 0 0 6px; }
  .card p { margin: 0; color: rgba(26,28,33,.6); font-size: 14px; }
  .btn { display: inline-block; min-height: 40px; line-height: 40px; padding: 0 18px; border-radius: 999px; border: 0; background: #2F5BEA; color: #fff; font: inherit; text-decoration: none; cursor: pointer; }
  footer { padding: 32px 24px; color: rgba(26,28,33,.6); font-size: 13px; text-align: center; }
  @media (max-width: 720px) { .hero { grid-template-columns: 1fr; } }`;

const DEFECT_CSS = {
  stutter: `
  .panel { position: fixed; top: 0; bottom: 0; width: 380px; left: 100%; background: #fff; padding: 24px; box-shadow: 0 0 40px rgba(0,0,0,.15); transition: left 700ms ease, width 700ms ease; }
  .open .panel { left: calc(100% - 428px); }`,
  'phone-overflow': `
  .facts { display: flex; gap: 16px; min-width: 980px; margin: 24px 0; }
  .facts span { white-space: nowrap; background: #fff; border: 1px solid #E4E4E7; border-radius: 8px; padding: 8px 12px; }
  .hero h1 { white-space: nowrap; }`,
  'contrast-targets': `
  body { color: #9A9AA0; }
  .card p, footer { color: #C4C4C8; }
  .btn { min-height: 18px; line-height: 18px; padding: 0 6px; font-size: 11px; background: #8FA6F0; }
  header nav a { font-size: 11px; color: #B0B0B5; }`,
  overlap: `
  .hero { position: relative; display: block; min-height: 340px; }
  .hero .copy { position: absolute; left: 0; top: 40px; width: 640px; z-index: 1; }
  .hero h1 { font-size: 52px; line-height: 1.05; }
  .hero .media { position: absolute; right: 0; top: 0; width: 46%; display: flex; align-items: flex-end; }
  .hero .caption { margin: 16px; font-size: 13px; color: rgba(26,28,33,.6); }
  @media (max-width: 720px) { .hero .copy { position: static; width: auto; } .hero .media { position: static; width: 100%; } }`,
};

const STUTTER_JS = `<script>
  const list = document.getElementById('rows');
  for (let i = 0; i < 300; i++) { const li = document.createElement('li'); li.textContent = 'Entry ' + (1000 + i); list.append(li); }
  document.getElementById('open').addEventListener('click', () => {
    document.body.classList.add('open');
    let n = 0;
    const t = setInterval(() => { for (const li of list.children) li.style.width = li.offsetWidth + 'px'; if (++n > 14) clearInterval(t); }, 40);
  });
</script>`;

// Headline, line and cards per artifact type, so the start page is recognisably that kind of page.
function shape(artifact, name, domain) {
  const card = (h, p) => `<div class="card"><h2>${esc(h)}</h2><p>${esc(p)}</p></div>`;
  const contentCards = domain.content.map((c) => card(cap(c), `Details about ${c} go here.`));
  switch (artifact.id) {
    case 'app-home': return { h1: 'Good morning', line: `Here is what is happening at ${name} today.`, cards: domain.content.map((c) => card(cap(c), 'Nothing new since yesterday.')) };
    case 'pricing': return { h1: 'Pricing', line: `Simple plans for ${domain.field}.`, cards: [['Basic', '9'], ['Standard', '29'], ['Pro', '79']].map(([p, n]) => card(`${p} · €${n} / month`, `Everything in ${p.toLowerCase()}, billed monthly.`)) };
    case 'product-page': return { h1: `${name} Signature`, line: '€49 · In stock', cards: contentCards };
    case 'event-poster': return { h1: `${name} open day`, line: 'Saturday 14 June · 10:00 to 16:00', cards: contentCards };
    default: return { h1: `Welcome to ${name}`, line: `${name} ${domain.premise}.`, cards: contentCards };
  }
}

export function fixtureHtml({ artifact, brand, domain, defect }) {
  const name = esc(brand.name);
  const sh = shape(artifact, brand.name, domain);
  // The overlap defect needs a headline long enough to reach the panel, and text in the panel.
  if (defect === 'overlap') sh.h1 = `${sh.h1}: ${domain.action}`;
  const cards = sh.cards.join('\n      ');
  const extraCards = ['About us', 'Contact', 'Questions'].map((t) => `<div class="card"><h2>${t}</h2><p>Short text about ${t.toLowerCase()}.</p></div>`).join('\n      ');
  const facts = defect === 'phone-overflow' ? `<div class="facts">${domain.content.map((c) => `<span>${esc(cap(c))}</span>`).join('')}<span>${esc(cap(domain.action))}</span></div>` : '';
  const stutter = defect === 'stutter';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name} · ${esc(artifact.label)}</title>
<style>${BASE_CSS}${DEFECT_CSS[defect] || ''}
</style></head>
<body>
  <header><strong>${name}</strong><nav><a href="#">Home</a><a href="#">About</a><a href="#">Contact</a></nav></header>
  <main>
    <section class="hero">
      <div class="copy"><h1>${esc(sh.h1)}</h1><p>${esc(sh.line)}</p><p><a class="btn" href="#">${esc(cap(domain.action))}</a>${stutter ? ' <button id="open" class="btn" type="button">Open details</button>' : ''}</p></div>
      <div class="media">${defect === 'overlap' ? `<p class="caption">Picture of ${esc(domain.content[0])}</p>` : ''}</div>
    </section>
    ${facts}
    <div class="grid">
      ${cards}
      ${extraCards}
    </div>
    ${stutter ? '<ul id="rows"></ul>' : ''}
  </main>
  ${stutter ? `<aside class="panel"><h2>Details</h2><p>More about ${esc(domain.content[0])}.</p></aside>` : ''}
  <footer>© ${name}</footer>
${stutter ? STUTTER_JS : ''}</body></html>
`;
}
