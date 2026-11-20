// Render a page across widths × themes (+ zoom) and find layout breaks.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch, toUrl } from './cdp.mjs';

// Runs inside the page. Returns findings for the current viewport.
const PROBE = String.raw`(() => {
  const vw = document.documentElement.clientWidth;
  const sel = (el) => {
    if (el.id) return '#' + el.id;
    let s = el.tagName.toLowerCase();
    const cls = [...el.classList].slice(0, 2);
    if (cls.length) s += '.' + cls.join('.');
    const p = el.parentElement;
    if (p) { const same = [...p.children].filter((c) => c.tagName === el.tagName); if (same.length > 1) s += ':nth-of-type(' + (same.indexOf(el) + 1) + ')'; }
    return s;
  };
  const visible = (el) => { const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const out = [];
  if (document.documentElement.scrollWidth > vw + 1) out.push({ rule: 'h-scroll', selector: 'html', detail: 'page is ' + document.documentElement.scrollWidth + 'px wide at a ' + vw + 'px viewport' });
  const texts = [...document.body.querySelectorAll('*')].filter((el) => !['SCRIPT','STYLE','NOSCRIPT','svg'].includes(el.tagName) && ownText(el) && visible(el));
  for (const el of texts) {
    const cs = getComputedStyle(el);
    if (cs.display.startsWith('inline') && cs.display !== 'inline-block' && cs.display !== 'inline-flex') continue;
    if (el.scrollWidth > el.clientWidth + 1 && cs.textOverflow !== 'ellipsis' && !['auto','scroll'].includes(cs.overflowX)) out.push({ rule: 'text-overflow', selector: sel(el), detail: 'text needs ' + el.scrollWidth + 'px, box is ' + el.clientWidth + 'px' });
  }
  const rectOf = (el) => { const range = document.createRange(); const rs = []; for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) { range.selectNodeContents(n); rs.push(...range.getClientRects()); } return rs; };
  const items = texts.slice(0, 400).map((el) => ({ el, rects: rectOf(el) }));
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j];
    if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
    const hit = a.rects.some((ra) => b.rects.some((rb) => Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left) > 4 && Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top) > 4));
    if (hit) out.push({ rule: 'overlap', selector: sel(a.el) + ' × ' + sel(b.el), detail: 'text boxes overlap' });
  }
  for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [onclick]')) {
    if (!visible(el)) continue;
    if (el.tagName === 'A' && el.parentElement && [...el.parentElement.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 24) out.push({ rule: 'small-target', selector: sel(el), detail: Math.round(r.width) + '×' + Math.round(r.height) + 'px' });
  }
  return { findings: out, title: document.title };
})()`;

export async function renderMatrix(target, { widths = [390, 768, 1440], themes = ['light', 'dark'], zoom = [2], height = 900, outDir, browser, navTimeoutMs = 30000 } = {}) {
  const url = toUrl(target);
  mkdirSync(outDir, { recursive: true });
  const own = !browser;
  const b = browser || await launch();
  const shots = []; const findings = [];
  try {
    const page = await b.newPage();
    const combos = [];
    for (const w of widths) for (const t of themes) combos.push({ width: w, theme: t, zoom: 1 });
    for (const z of zoom) for (const t of themes) combos.push({ width: Math.max(...widths, 1440), theme: t, zoom: z });
    for (const c of combos) {
      // Browser zoom: the layout viewport shrinks by the zoom factor while the physical width stays.
      await page.send('Emulation.setDeviceMetricsOverride', { width: Math.round(c.width / c.zoom), height: Math.round(height / c.zoom), deviceScaleFactor: c.zoom, mobile: c.width < 600 });
      await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: c.theme }] });
      await page.goto(url, { timeoutMs: navTimeoutMs });
      const { findings: f, title } = await page.eval(PROBE);
      const path = join(outDir, `${c.width}-${c.theme}${c.zoom > 1 ? `-zoom${c.zoom * 100}` : ''}.png`);
      await page.screenshot(path, { captureBeyondViewport: false });
      shots.push({ ...c, path, title });
      for (const x of f) findings.push({ ...x, width: c.width, theme: c.theme, zoom: c.zoom });
    }
    await page.close();
  } finally { if (own) await b.close(); }
  return { shots, findings };
}
