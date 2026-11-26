import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findChrome, toUrl, TargetError } from '../scripts/lib/cdp.mjs';
import { renderMatrix } from '../scripts/lib/render.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const FX = join(here, 'fixtures/render');
const skip = findChrome(process.env) ? false : 'Chrome not installed';
const out = () => mkdtempSync(join(tmpdir(), 'apollo-render-'));
const cli = (env, ...a) => spawnSync(process.execPath, [join(here, '../scripts/cli.mjs'), ...a], { encoding: 'utf8', env: { ...process.env, ...env } });

test('toUrl passes URLs, converts html paths, rejects folders', () => {
  assert.equal(toUrl('http://localhost:3000/x'), 'http://localhost:3000/x');
  assert.match(toUrl(join(FX, 'clean.html')), /^file:\/\/.*clean\.html$/);
  assert.throws(() => toUrl(FX), TargetError);
  assert.throws(() => toUrl(join(FX, 'nope.html')), TargetError);
});

test('clean.html → 0 findings and 8 screenshots exist', { skip, timeout: 60000 }, async () => {
  const r = await renderMatrix(join(FX, 'clean.html'), { outDir: out() });
  assert.deepEqual(r.findings, []);
  assert.equal(r.shots.length, 8);
  for (const s of r.shots) assert.ok(existsSync(s.path), s.path);
});

test('dark theme is emulated', { skip, timeout: 60000 }, async () => {
  const r = await renderMatrix(join(FX, 'clean.html'), { outDir: out(), widths: [390], zoom: [] });
  assert.deepEqual(r.shots.map((s) => [s.theme, s.title]), [['light', 'false'], ['dark', 'true']]);
});

test('overflow.html → h-scroll at 390 and text-overflow', { skip, timeout: 60000 }, async () => {
  const r = await renderMatrix(join(FX, 'overflow.html'), { outDir: out(), themes: ['light'], zoom: [] });
  assert.ok(r.findings.some((f) => f.rule === 'h-scroll' && f.width === 390));
  assert.ok(!r.findings.some((f) => f.rule === 'h-scroll' && f.width === 1440));
  assert.ok(r.findings.some((f) => f.rule === 'text-overflow' && f.selector === '#name'));
});

test('overlap.html → overlap finding naming both selectors', { skip, timeout: 60000 }, async () => {
  const r = await renderMatrix(join(FX, 'overlap.html'), { outDir: out(), widths: [768], themes: ['light'], zoom: [] });
  const o = r.findings.find((f) => f.rule === 'overlap');
  assert.ok(o, JSON.stringify(r.findings));
  assert.match(o.selector, /#a/);
  assert.match(o.selector, /#b/);
});

test('missing Chrome → exit 2', () => {
  const r = cli({ CHROME_PATH: '/nonexistent' }, 'render', join(FX, 'clean.html'));
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Chrome not found/);
});

test('folder target → exit 2', () => {
  const r = cli({}, 'render', FX);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /start the dev server/);
});

test('a fixed bottom bar over scrolling content is fine when the page pads for it', { skip, timeout: 60000 }, async () => {
  const r = await renderMatrix(join(FX, 'fixed-bar-padded.html'), { outDir: out() });
  assert.deepEqual(r.findings.filter((f) => f.rule === 'overlap'), []);
});

test('text that stays under a fixed bar at every scroll position is an overlap', { skip, timeout: 60000 }, async () => {
  const r = await renderMatrix(join(FX, 'fixed-bar-unpadded.html'), { outDir: out(), widths: [390], themes: ['light'], zoom: [] });
  const o = r.findings.find((f) => f.rule === 'overlap' && /#last × nav/.test(f.selector));
  assert.ok(o, JSON.stringify(r.findings));
  assert.ok(!r.findings.some((f) => /:nth-of-type\([1-9]\) × nav/.test(f.selector)), 'rows that scroll clear are not flagged');
  assert.match(o.detail, /every scroll position/);
});

test('cli render saves render.json next to the screenshots for critics to reuse', { skip, timeout: 60000 }, () => {
  const o = out();
  const r = cli({}, 'render', join(FX, 'clean.html'), '--out', o, '--widths', '390', '--themes', 'light', '--zoom', '');
  assert.equal(r.status, 0, r.stderr);
  const j = JSON.parse(readFileSync(join(o, 'render.json'), 'utf8'));
  assert.equal(j.shots.length, 1);
  assert.deepEqual(j.findings, []);
  assert.match(j.target, /clean\.html$/);
});
