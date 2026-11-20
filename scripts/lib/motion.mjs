// Measure motion in a real browser: main-thread frame timing, an inventory of every running
// animation (properties, duration, easing), dial-based violations and a real-speed flipbook.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { launch, toUrl, sleep, TargetError } from './cdp.mjs';

const RECORDER = String.raw`(() => {
  const H = window.__heph = { deltas: [], anims: [], seen: new Set(), running: true };
  let last = performance.now();
  const tick = (t) => { H.deltas.push(t - last); last = t; if (H.running) requestAnimationFrame(tick); };
  requestAnimationFrame((t) => { last = t; requestAnimationFrame(tick); });
  const kebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
  const SKIP = new Set(['offset', 'easing', 'composite', 'computedOffset']);
  const poll = () => {
    for (const a of document.getAnimations()) {
      if (H.seen.has(a)) continue;
      H.seen.add(a);
      const eff = a.effect; if (!eff) continue;
      const kfs = eff.getKeyframes(); const timing = eff.getTiming();
      const props = [...new Set(kfs.flatMap((k) => Object.keys(k).filter((x) => !SKIP.has(x)).map(kebab)))];
      const target = eff.target; const host = target && target.closest ? target.closest('[data-motion]') : null;
      H.anims.push({
        name: a.animationName || a.transitionProperty || a.id || 'animation',
        properties: props,
        durationMs: typeof timing.duration === 'number' ? Math.round(timing.duration) : 0,
        delayMs: Math.round(timing.delay || 0),
        easing: timing.easing,
        keyframeEasings: kfs.map((k) => k.easing).filter(Boolean),
        transforms: kfs.map((k) => k.transform).filter(Boolean),
        exemption: host ? host.getAttribute('data-motion') : null,
      });
    }
  };
  H.poll = setInterval(poll, 50); poll();
  H.stop = () => { H.running = false; clearInterval(H.poll); poll(); return { deltas: H.deltas.slice(2), anims: H.anims }; };
  return true;
})()`;

const CALM_PROPS = new Set(['opacity', 'color', 'background-color', 'border-color', 'fill', 'stroke', 'box-shadow', 'transform', 'visibility']);
const isColourProp = (p) => p.endsWith('-color');

export function bezierOvershoots(easing) {
  const m = /cubic-bezier\(([^)]+)\)/.exec(easing || '');
  if (!m) return /^(spring|bounce)/.test(easing || '');
  const n = m[1].split(',').map(Number);
  return n[1] < 0 || n[1] > 1 || n[3] < 0 || n[3] > 1;
}

export function transformExtent(values) {
  let translate = 0; let scaleMin = 1; let scaleMax = 1;
  for (const v of values) {
    const mat = /matrix\(([^)]+)\)/.exec(v);
    if (mat) { const n = mat[1].split(',').map(Number); const s = Math.hypot(n[0], n[1]); scaleMin = Math.min(scaleMin, s); scaleMax = Math.max(scaleMax, s); translate = Math.max(translate, Math.abs(n[4]), Math.abs(n[5])); continue; }
    for (const t of v.matchAll(/translate(?:X|Y|3d)?\(([^)]+)\)/g)) for (const part of t[1].split(',')) { const px = /(-?[\d.]+)px/.exec(part); if (px) translate = Math.max(translate, Math.abs(+px[1])); }
    for (const s of v.matchAll(/scale(?:X|Y)?\(([^)]+)\)/g)) for (const part of s[1].split(',')) { const x = parseFloat(part); if (!Number.isNaN(x)) { scaleMin = Math.min(scaleMin, x); scaleMax = Math.max(scaleMax, x); } }
  }
  return { translate, scaleMin, scaleMax };
}

export function violationsFor(anims, dial, { reducedMotion = false } = {}) {
  const v = [];
  const easingsOf = (a) => [a.easing, ...a.keyframeEasings];
  for (const a of anims) {
    const tag = `${a.name} (${a.properties.join(', ')}, ${a.durationMs}ms)`;
    const limit = a.exemption === 'opening' || a.exemption === 'reveal' ? 3000 : null;
    if (reducedMotion && a.properties.some((p) => ['transform', 'filter', 'backdrop-filter', 'clip-path', 'translate', 'scale', 'rotate'].includes(p))) v.push({ rule: 'reduced-motion-ignored', detail: `${tag} still moves under prefers-reduced-motion` });
    if (dial === 'showcase') continue;
    if (dial === 'still') {
      if (a.durationMs > 160) v.push({ rule: 'duration', detail: `${tag} exceeds 160ms (still)` });
      const bad = a.properties.filter((p) => p !== 'opacity' && !isColourProp(p) && p !== 'color');
      if (bad.length) v.push({ rule: 'property', detail: `${tag}: ${bad.join(', ')} not allowed at still` });
      continue;
    }
    if (easingsOf(a).some(bezierOvershoots)) v.push({ rule: 'overshoot', detail: `${tag} uses an overshoot curve` });
    if (dial === 'calm') {
      const bad = a.properties.filter((p) => !CALM_PROPS.has(p) && !isColourProp(p));
      if (bad.length) v.push({ rule: 'property', detail: `${tag}: ${bad.join(', ')} not allowed at calm` });
      if (a.properties.includes('transform')) {
        const t = transformExtent(a.transforms);
        if (t.translate > 8) v.push({ rule: 'translate', detail: `${tag} moves ${Math.round(t.translate)}px (calm allows ≤8px)` });
        if (t.scaleMin < 0.95 || t.scaleMax > 1.08) v.push({ rule: 'scale', detail: `${tag} scales ${t.scaleMin.toFixed(2)}–${t.scaleMax.toFixed(2)} (calm allows 0.95–1.08)` });
      }
      if (a.durationMs > (limit ?? 240)) v.push({ rule: 'duration', detail: `${tag} exceeds ${limit ?? 240}ms` });
    }
    if (dial === 'expressive' && a.durationMs > (limit ?? 600)) v.push({ rule: 'duration', detail: `${tag} exceeds ${limit ?? 600}ms` });
  }
  if (dial === 'calm' || dial === 'still') {
    const groups = new Map();
    for (const a of anims) if (a.exemption !== 'reveal') groups.set(a.name, [...(groups.get(a.name) || []), a.delayMs]);
    for (const [name, delays] of groups) {
      if (delays.length < 3) continue;
      const d = [...delays].sort((x, y) => x - y); const step = d[1] - d[0];
      if (step > 0 && d.every((x, i) => i === 0 || Math.abs(x - d[i - 1] - step) <= 5)) v.push({ rule: 'stagger', detail: `${name}: ${delays.length} items enter with a ${step}ms stagger (mark data reveals with data-motion="reveal")` });
    }
  }
  return v;
}

function flipbookHtml(frames) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Motion flipbook</title>
<style>
:root{--ground:#F4F4F5;--surface:#FFFFFF;--ink:#1A1C21;--muted:rgba(26,28,33,.6);--line:rgba(26,28,33,.1);--accent:#2F5BEA}
@media (prefers-color-scheme: dark){:root{--ground:#131517;--surface:#1C1E21;--ink:#ECEDEE;--muted:rgba(236,237,238,.6);--line:rgba(236,237,238,.12)}}
body{margin:0;background:var(--ground);color:var(--ink);font:14px/1.5 system-ui,sans-serif}
main{max-width:1100px;margin:0 auto;padding:24px 16px}
img{display:block;width:100%;height:auto;border-radius:12px;background:var(--surface)}
.bar{display:flex;gap:8px;align-items:center;margin-top:12px}
button{min-height:36px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;transition:background-color 140ms cubic-bezier(.22,1,.36,1)}
button[aria-pressed=true]{background:var(--accent);color:#fff;border-color:transparent}
button:active{transform:scale(.97)}
span{color:var(--muted);font-variant-numeric:tabular-nums}
</style></head><body><main><img id="f" alt="Recorded animation frame"><div class="bar">
<button id="play" type="button">Pause</button><button id="slow" type="button" aria-pressed="false">0.25×</button><span id="t"></span></div></main>
<script>
const FRAMES = ${JSON.stringify(frames)};
const img = document.getElementById('f'), t = document.getElementById('t');
let i = 0, playing = true, speed = 1, timer;
const show = () => { img.src = FRAMES[i].file; t.textContent = Math.round(FRAMES[i].ms) + ' ms · frame ' + (i + 1) + '/' + FRAMES.length; };
const step = () => { show(); const next = (i + 1) % FRAMES.length; const gap = next ? FRAMES[next].ms - FRAMES[i].ms : 800; i = next; if (playing) timer = setTimeout(step, Math.max(gap, 4) / speed); };
document.getElementById('play').onclick = (e) => { playing = !playing; e.target.textContent = playing ? 'Pause' : 'Play'; clearTimeout(timer); if (playing) step(); };
document.getElementById('slow').onclick = (e) => { speed = speed === 1 ? 0.25 : 1; e.target.setAttribute('aria-pressed', String(speed !== 1)); };
FRAMES.length ? step() : (t.textContent = 'No frames were captured: nothing changed on screen.');
</script></body></html>`;
}

async function trigger(page, tr) {
  if (!tr || tr.type === 'load') return;
  if (tr.type === 'eval') { await page.eval(tr.expr); return; }
  const box = await page.eval(`(() => { const el = document.querySelector(${JSON.stringify(tr.selector)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  if (!box) throw new TargetError(`trigger element not found: ${tr.selector}`);
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y });
  if (tr.type === 'click') {
    await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 });
  }
}

const dbg = (...a) => { if (process.env.APOLLO_DEBUG) console.error(`[motion ${new Date().toISOString().slice(11, 23)}]`, ...a); };

export async function measureMotion(target, { trigger: tr, durationMs = 2000, dial = 'calm', outDir, reducedMotion = false, width = 1280, height = 800, navTimeoutMs = 30000 } = {}) {
  const url = toUrl(target);
  mkdirSync(outDir, { recursive: true });
  dbg('launch');
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' }] });
    dbg('goto');
    await page.goto(url, { timeoutMs: navTimeoutMs });
    dbg('recorder');
    await page.eval(RECORDER);
    const frames = []; let t0 = null;
    const off = page.onEvent('Page.screencastFrame', ({ data, metadata, sessionId }) => {
      page.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
      const ts = metadata.timestamp * 1000; if (t0 === null) t0 = ts;
      const file = `frame-${String(frames.length).padStart(3, '0')}.jpg`;
      writeFileSync(join(outDir, file), Buffer.from(data, 'base64'));
      frames.push({ file, ms: ts - t0 });
    });
    dbg('screencast');
    await page.send('Page.startScreencast', { format: 'jpeg', quality: 80, everyNthFrame: 1 });
    await sleep(120);
    dbg('trigger');
    await trigger(page, tr);
    dbg('wait');
    await sleep(durationMs);
    dbg('stop');
    const { deltas, anims } = await page.eval('window.__heph.stop()');
    dbg('stopScreencast');
    await page.send('Page.stopScreencast');
    off();
    const sorted = [...deltas].sort((a, b) => a - b);
    const p95ms = sorted.length ? Math.round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] * 10) / 10 : 0;
    const dropped = deltas.filter((d) => d > 25).length;
    const animatingS = Math.max(1, ...anims.map((a) => (a.delayMs + a.durationMs) / 1000));
    const violations = violationsFor(anims, dial, { reducedMotion });
    if (dropped > Math.ceil(animatingS) || p95ms > 20) violations.push({ rule: 'dropped-frames', detail: `${dropped} dropped frames, p95 ${p95ms}ms (allowed ≤${Math.ceil(animatingS)} dropped, p95 ≤20ms)` });
    const flipbook = join(outDir, 'flipbook.html');
    writeFileSync(flipbook, flipbookHtml(frames));
    dbg('page.close');
    await page.close();
    dbg('done');
    return { frames: { count: deltas.length, dropped, p95ms }, animations: anims.map(({ transforms, keyframeEasings, ...a }) => a), violations, flipbook };
  } finally { dbg('browser.close'); await browser.close(); dbg('closed'); }
}
