// Blind A/B sheets, the parts that need no browser: arms and sides, what to capture, the sheet layout,
// the scoring template and the tally.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { rng, seedOf } from './rng.mjs';

export const DESKTOP = { name: 'desktop', label: 'Desktop 1440', width: 1440, height: 900, mobile: false, capHeight: 5400, shownWidth: 960 };
export const PHONE = { name: 'phone', label: 'Phone 390', width: 390, height: 844, mobile: true, capHeight: 3600, shownWidth: 390 };
export const FRAME_POINTS = [0.08, 0.25, 0.45, 0.7];

const dirs = (p) => (existsSync(p) ? readdirSync(p).filter((e) => statSync(join(p, e)).isDirectory()).sort() : []);

// The two arms in <runRoot>/arms. new/old come first in that order when present.
export function listArms(runRoot) {
  const arms = dirs(join(runRoot, 'arms'));
  if (arms.length !== 2) throw new Error(`expected exactly two arm folders in ${join(runRoot, 'arms')}, found ${arms.length ? arms.join(', ') : 'none'} (run evals/collect.mjs first)`);
  return arms.includes('new') && arms.includes('old') ? ['new', 'old'] : arms;
}

export function listCases(runRoot, arms) {
  const [a, b] = arms.map((arm) => dirs(join(runRoot, 'arms', arm)));
  const notices = [...a.filter((c) => !b.includes(c)).map((c) => `case "${c}" has no output in arm ${arms[1]}; skipped`), ...b.filter((c) => !a.includes(c)).map((c) => `case "${c}" has no output in arm ${arms[0]}; skipped`)];
  return { cases: a.filter((c) => b.includes(c)), notices };
}

// Random A/B per case. The key goes to a file outside the sheets folder.
export function assignSides(cases, arms, seed) {
  const sides = {};
  for (const c of cases) {
    const flip = rng(seedOf(`${seed}:${c}`))() < 0.5;
    sides[c] = flip ? { A: arms[1], B: arms[0] } : { A: arms[0], B: arms[1] };
  }
  return { seed, arms, sides };
}

// The page to photograph for one arm and case. Motion cases use the live page, not the collected flipbook.
export function targetFor(runRoot, arm, c, info) {
  const dir = join(runRoot, 'arms', arm, c);
  if (info?.motion) {
    const live = join(dir, info.motion.file);
    if (existsSync(live)) return live;
  }
  const index = join(dir, 'index.html');
  return existsSync(index) ? index : null;
}

// Pick the frames shown for a motion case: the last frame at or before each point of the recording.
export function pickFrames(frames, durationMs, points = FRAME_POINTS) {
  if (!frames.length) return [];
  const sorted = [...frames].sort((x, y) => x.ms - y.ms);
  return points.map((p) => {
    const at = p * durationMs;
    const before = sorted.filter((f) => f.ms <= at);
    return { ...(before.length ? before.at(-1) : sorted[0]), at: Math.round(at) };
  });
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function shotHtml(shot, vp, side) {
  if (!shot || shot.error) return `<div class="missing" style="width:${vp.shownWidth}px">${esc(shot?.error || 'No output')}</div>`;
  const cut = shot.fullHeight > shot.height ? `<p class="cut">Page continues: ${shot.fullHeight}px tall, cut at ${shot.height}px</p>` : '';
  return `<img src="${esc(shot.src)}" alt="${side} ${vp.label}" style="width:${vp.shownWidth}px">${cut}`;
}

function framesHtml(frames, vp, side) {
  if (!frames?.length) return '';
  const w = vp.name === 'phone' ? Math.floor((DESKTOP.shownWidth - 3 * 16) / 4) : Math.floor((vp.shownWidth - 16) / 2);
  return `<div class="frames ${vp.name}">${frames.map((f) => `<figure><img src="${esc(f.src)}" alt="${side} ${vp.label} at ${f.at} ms" style="width:${w}px"><figcaption>${side} · ${f.at} ms</figcaption></figure>`).join('')}</div>`;
}

// One sheet: desktop on top, phone below, A left and B right. Motion cases add four frames before each end state.
export function sheetHtml({ id, summary, motion, A, B }) {
  const col = (side, s) => [DESKTOP, PHONE].map((vp) => `
    <section><h3><b>${side}</b> ${vp.label}${motion ? ' · frames, then the end state' : ''}</h3>
      ${motion ? `${framesHtml(s?.frames?.[vp.name], vp, side)}<p class="end">${side} · end state</p>` : ''}
      ${shotHtml(s?.[vp.name], vp, side)}
    </section>`).join('');
  const width = 2 * DESKTOP.shownWidth + 48 + 64;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(id)}</title><style>
body{margin:0;width:${width}px;background:#26282C;color:#F4F4F5;font:16px/1.45 system-ui,sans-serif}
header{padding:28px 32px 8px}h1{margin:0;font-size:28px;letter-spacing:-.01em}header p{margin:6px 0 0;color:#B9BBC0;max-width:1600px}
.cols{display:grid;grid-template-columns:${DESKTOP.shownWidth}px ${DESKTOP.shownWidth}px;gap:48px;padding:16px 32px 40px}
.label{font-size:96px;font-weight:800;line-height:1;margin:0 0 8px}
section{margin:0 0 32px}h3{margin:0 0 10px;font-size:18px;font-weight:600;color:#D4D6DA}h3 b{display:inline-block;min-width:28px;padding:0 8px;margin-right:8px;border-radius:6px;background:#F4F4F5;color:#26282C;text-align:center}
img{display:block;background:#fff;outline:1px solid #4A4D53}
.cut{margin:6px 0 0;font-size:13px;color:#B9BBC0}
.missing{display:grid;place-items:center;height:300px;border:2px dashed #6A6D73;color:#D4D6DA;font-size:20px}
.frames{display:grid;grid-template-columns:repeat(2,max-content);gap:0 16px;margin:0 0 8px}.frames.phone{display:flex;gap:16px}.end{margin:0 0 4px;font-size:13px;color:#B9BBC0}figure{margin:0 0 12px}figcaption{font-size:13px;color:#B9BBC0;margin-top:4px}
</style></head><body>
<header><h1>${esc(id)}</h1><p>${esc(summary)}</p></header>
<div class="cols">
  <div><p class="label">A</p>${col('A', A)}</div>
  <div><p class="label">B</p>${col('B', B)}</div>
</div></body></html>`;
}

export function scoringTemplate(cases, runRoot = '<runRoot>') {
  return `# Blind sheets: scores

Open each sheet in sheets/ and fill in its block. Do not open ../sheets-key.json until you are done.

- winner: A, B or tie
- both-weak: yes when neither output is good (optional; blank means no)
- ship: yes or no. Is the winner good enough to ship as it is? On a tie, answer for the pair.
- note: optional, one line

Then reveal and record: node evals/sheets.mjs --score ${runRoot}
${cases.map((c) => `
## ${c.name}
summary: ${c.summary}
winner:
both-weak:
ship:
note:
`).join('')}`;
}

const yesNo = (v) => (/^(y|yes|true)$/i.test(v) ? true : /^(n|no|false)$/i.test(v) ? false : null);

export function parseScores(md) {
  const out = {};
  for (const block of md.split(/^## /m).slice(1)) {
    const [head, ...lines] = block.split('\n');
    const f = {};
    for (const l of lines) { const m = /^([\w-]+):\s*(.*)$/.exec(l.trim()); if (m) f[m[1].toLowerCase()] = m[2].trim(); }
    const w = (f.winner || '').toLowerCase();
    out[head.trim()] = {
      winner: w === 'a' ? 'A' : w === 'b' ? 'B' : /^(tie|draw|=)$/.test(w) ? 'tie' : null,
      bothWeak: yesNo(f['both-weak'] || '') === true,
      ship: yesNo(f.ship || ''),
      note: f.note || '',
    };
  }
  return out;
}

// Reveal the key and count. `focus` is the arm being judged (Apollo, the "new" arm, when present).
export function tally(scores, key, { focus } = {}) {
  const arms = key.arms;
  const me = focus || (arms.includes('new') ? 'new' : arms[0]);
  const wins = Object.fromEntries(arms.map((a) => [a, 0]));
  const shipWhenWon = Object.fromEntries(arms.map((a) => [a, 0]));
  let ties = 0; let bothWeak = 0; let shipYes = 0; let shipNo = 0; let shipUnanswered = 0; let focusShippable = 0;
  const cases = []; const unscored = [];
  for (const [c, sides] of Object.entries(key.sides)) {
    const s = scores[c];
    if (!s || !s.winner) { unscored.push(c); continue; }
    const winner = s.winner === 'tie' ? 'tie' : sides[s.winner];
    if (winner === 'tie') ties++; else wins[winner]++;
    if (s.bothWeak) bothWeak++;
    if (s.ship === true) { shipYes++; if (winner !== 'tie') shipWhenWon[winner]++; if (winner === me || winner === 'tie') focusShippable++; } else if (s.ship === false) shipNo++; else shipUnanswered++;
    cases.push({ case: c, A: sides.A, B: sides.B, pick: s.winner, winner, bothWeak: s.bothWeak, ship: s.ship, ...(s.note && { note: s.note }) });
  }
  return { focus: me, arms, cases, unscored, totals: { scored: cases.length, wins, ties, bothWeak, ship: { yes: shipYes, no: shipNo, unanswered: shipUnanswered }, shipWhenWon, focusShippable } };
}
