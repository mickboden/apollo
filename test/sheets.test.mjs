import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findChrome } from '../scripts/lib/cdp.mjs';
import { assignSides, listArms, listCases, parseScores, pickFrames, scoringTemplate, sheetHtml, tally, targetFor } from '../evals/lib/sheets.mjs';
import { appendLedger, readLedger, trendLines } from '../evals/lib/ledger.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const skip = findChrome(process.env) ? false : 'Chrome not installed';
const page = (body) => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;font:20px system-ui">${body}</body></html>`;

function runRoot(cases = ['alpha', 'beta', 'gamma']) {
  const root = mkdtempSync(join(tmpdir(), 'apollo-sheets-'));
  for (const arm of ['new', 'old']) for (const c of cases) {
    mkdirSync(join(root, 'arms', arm, c), { recursive: true });
    writeFileSync(join(root, 'arms', arm, c, 'index.html'), page(`<h1>${arm} ${c}</h1>`));
  }
  return root;
}

test('arms and cases are found; a case missing from one arm is reported, not shown', () => {
  const root = runRoot();
  mkdirSync(join(root, 'arms', 'new', 'lonely'));
  const arms = listArms(root);
  assert.deepEqual(arms, ['new', 'old']);
  const { cases, notices } = listCases(root, arms);
  assert.deepEqual(cases, ['alpha', 'beta', 'gamma']);
  assert.match(notices[0], /lonely/);
  mkdirSync(join(root, 'arms', 'third'));
  assert.throws(() => listArms(root), /exactly two/);
});

test('sides are random per case, reproducible per seed, and cover both arms', () => {
  const cases = Array.from({ length: 40 }, (_, i) => `c${i}`);
  const k = assignSides(cases, ['new', 'old'], 5);
  assert.deepEqual(k, assignSides(cases, ['new', 'old'], 5));
  assert.notDeepEqual(k.sides, assignSides(cases, ['new', 'old'], 6).sides);
  const aIsNew = Object.values(k.sides).filter((s) => s.A === 'new').length;
  assert.ok(aIsNew > 8 && aIsNew < 32, `A=new in ${aIsNew}/40`);
  for (const s of Object.values(k.sides)) assert.deepEqual([s.A, s.B].sort(), ['new', 'old']);
});

test('the sheet lays out desktop above phone, A left of B, with no arm names', () => {
  const shots = (side) => ({ desktop: { src: `${side}-desktop.png`, height: 5400, fullHeight: 8000 }, phone: { src: `${side}-phone.png`, height: 900, fullHeight: 900 } });
  const html = sheetHtml({ id: 'case-x', summary: 'a summary', motion: false, A: shots('A'), B: shots('B') });
  assert.ok(html.indexOf('A-desktop.png') < html.indexOf('A-phone.png'));
  assert.ok(html.indexOf('A-phone.png') < html.indexOf('B-desktop.png'));
  assert.match(html, /class="label">A</); assert.match(html, /class="label">B</);
  assert.match(html, /cut at 5400px/);
  assert.doesNotMatch(html, /\b(new|old)\b/);
  const motion = sheetHtml({ id: 'm', summary: '', motion: true, A: { ...shots('A'), frames: { desktop: [1, 2, 3, 4].map((i) => ({ src: `A-f${i}.jpg`, at: i * 100 })), phone: [] } }, B: { desktop: { error: 'No output' } } });
  for (let i = 1; i <= 4; i++) assert.ok(motion.includes(`A-f${i}.jpg`));
  assert.match(motion, /end state/);
  assert.match(motion, /No output/);
});

test('frames are picked at fixed points of the recording', () => {
  const frames = [0, 150, 450, 880, 1350, 2600].map((ms) => ({ ms, file: `f${ms}` }));
  assert.deepEqual(pickFrames(frames, 2000).map((f) => f.file), ['f150', 'f450', 'f880', 'f1350']);
  assert.deepEqual(pickFrames([{ ms: 500, file: 'late' }], 1000).map((f) => f.file), ['late', 'late', 'late', 'late']);
  assert.deepEqual(pickFrames([], 1000), []);
});

test('motion cases photograph the live page, not the collected flipbook', () => {
  const root = runRoot(['anim']);
  mkdirSync(join(root, 'arms', 'new', 'anim', 'out'));
  writeFileSync(join(root, 'arms', 'new', 'anim', 'out', 'index.html'), page('live'));
  const info = { motion: { file: 'out/index.html' } };
  assert.match(targetFor(root, 'new', 'anim', info), /anim[\\/]out[\\/]index\.html$/);
  assert.match(targetFor(root, 'old', 'anim', info), /anim[\\/]index\.html$/);
  assert.equal(targetFor(root, 'old', 'nope', null), null);
});

test('scores parse leniently and the tally reveals arms, ties, both-weak and ship', () => {
  const tpl = scoringTemplate([{ name: 'alpha', summary: 's' }, { name: 'beta', summary: 's' }, { name: 'gamma', summary: 's' }, { name: 'delta', summary: 's' }]);
  for (const k of ['winner:', 'both-weak:', 'ship:']) assert.ok(tpl.includes(k));
  const filled = tpl.replace(/## alpha\nsummary: s\nwinner:\nboth-weak:\nship:/, '## alpha\nsummary: s\nwinner: a\nboth-weak:\nship: yes')
    .replace(/## beta\nsummary: s\nwinner:\nboth-weak:\nship:/, '## beta\nsummary: s\nwinner: B\nboth-weak: no\nship: no')
    .replace(/## gamma\nsummary: s\nwinner:\nboth-weak:\nship:/, '## gamma\nsummary: s\nwinner: Tie\nboth-weak: yes\nship: n');
  const scores = parseScores(filled);
  assert.deepEqual(scores.alpha, { winner: 'A', bothWeak: false, ship: true, note: '' });
  assert.equal(scores.gamma.winner, 'tie');
  assert.equal(scores.delta.winner, null);
  const key = { arms: ['new', 'old'], sides: { alpha: { A: 'new', B: 'old' }, beta: { A: 'new', B: 'old' }, gamma: { A: 'old', B: 'new' }, delta: { A: 'old', B: 'new' } } };
  const t = tally(scores, key);
  assert.equal(t.focus, 'new');
  assert.deepEqual(t.totals.wins, { new: 1, old: 1 });
  assert.equal(t.totals.ties, 1);
  assert.equal(t.totals.bothWeak, 1);
  assert.deepEqual(t.totals.ship, { yes: 1, no: 2, unanswered: 0 });
  assert.equal(t.totals.focusShippable, 1);
  assert.deepEqual(t.unscored, ['delta']);
  assert.equal(t.cases.find((c) => c.case === 'beta').winner, 'old');
});

test('the ledger appends, replaces a re-scored run, and shows a per-case trend', () => {
  const file = join(mkdtempSync(join(tmpdir(), 'apollo-ledger-')), 'regression.jsonl');
  const entry = (run, winner, ship) => ({ run, date: '2026-11-26T00:00:00Z', label: run, apollo: { commit: 'abc1234' }, focus: 'new', arms: ['new', 'old'], cases: [{ case: 'landing-hero', winner, ship, bothWeak: false }], totals: { scored: 1, wins: { new: winner === 'new' ? 1 : 0, old: winner === 'old' ? 1 : 0 }, ties: winner === 'tie' ? 1 : 0, bothWeak: 0, focusShippable: ship ? 1 : 0 } });
  appendLedger(file, entry('r1', 'old', false));
  appendLedger(file, entry('r2', 'new', true));
  appendLedger(file, entry('r2', 'tie', false));
  const all = readLedger(file);
  assert.deepEqual(all.map((e) => e.run), ['r1', 'r2']);
  const lines = trendLines(all, { perCase: true }).join('\n');
  assert.match(lines, /landing-hero\s+L\s+T/);
  assert.match(trendLines([])[0], /No rounds/);
});

test('score command reveals, writes the result and records it in the ledger', () => {
  const root = runRoot(['alpha', 'beta']);
  writeFileSync(join(root, 'sheets-key.json'), JSON.stringify(assignSides(['alpha', 'beta'], ['new', 'old'], 1)));
  mkdirSync(join(root, 'sheets'));
  writeFileSync(join(root, 'sheets', 'scores.md'), '## alpha\nwinner: A\nship: yes\n\n## beta\nwinner: tie\nboth-weak: yes\nship: no\n');
  writeFileSync(join(root, 'run.json'), JSON.stringify({ track: 'creative', startedAt: 'x', apollo: { version: '0.1.0', commit: 'abc' }, arms: { new: 'apollo', old: 'baseline' } }));
  const ledger = join(root, 'ledger.jsonl');
  const r = spawnSync(process.execPath, [join(here, '../evals/sheets.mjs'), '--score', root, '--ledger', ledger], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /alpha\s+A=(new|old)/);
  const res = JSON.parse(readFileSync(join(root, 'sheets-result.json'), 'utf8'));
  assert.equal(res.track, 'creative');
  assert.equal(res.totals.scored, 2);
  assert.equal(readLedger(ledger).length, 1);
});

test('sheets render: one PNG per case, key outside the sheets folder, template written', { skip, timeout: 120000 }, () => {
  const root = runRoot(['alpha', 'beta']);
  const r = spawnSync(process.execPath, [join(here, '../evals/sheets.mjs'), root, '--seed', '4'], { encoding: 'utf8', timeout: 110000 });
  assert.equal(r.status, 0, r.stderr);
  for (const c of ['alpha', 'beta']) {
    const png = readFileSync(join(root, 'sheets', `${c}.png`));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), 2032, 'sheet width');
    assert.ok(png.readUInt32BE(20) > 900, 'sheet height');
  }
  assert.ok(existsSync(join(root, 'sheets-key.json')));
  assert.ok(!existsSync(join(root, 'sheets', 'sheets-key.json')));
  assert.match(readFileSync(join(root, 'sheets', 'scores.md'), 'utf8'), /## alpha/);
});
