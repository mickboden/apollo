import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findChrome } from '../scripts/lib/cdp.mjs';
import { measureMotion } from '../scripts/lib/motion.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const FX = join(here, 'fixtures/motion');
const skip = findChrome(process.env) ? false : 'Chrome not installed';
const out = () => mkdtempSync(join(tmpdir(), 'apollo-motion-'));
const click = { type: 'click', selector: '#go' };
const m = (file, dial, extra = {}) => measureMotion(join(FX, file), { trigger: click, durationMs: 1200, dial, outDir: out(), ...extra });
const rules = (r) => r.violations.map((v) => v.rule);

test('calm-fade at calm → 0 violations, opacity animated at 180ms', { skip, timeout: 60000 }, async () => {
  const r = await m('calm-fade.html', 'calm');
  assert.deepEqual(r.violations, []);
  const a = r.animations.find((x) => x.properties.includes('opacity'));
  assert.ok(a, JSON.stringify(r.animations));
  assert.equal(a.durationMs, 180);
});

test('blur-swap at calm → property violation listing filter', { skip, timeout: 60000 }, async () => {
  const r = await m('blur-swap.html', 'calm');
  assert.ok(r.violations.some((v) => v.rule === 'property' && /filter/.test(v.detail)), JSON.stringify(r.violations));
});

test('blur-swap at showcase → no property violation', { skip, timeout: 60000 }, async () => {
  const r = await m('blur-swap.html', 'showcase');
  assert.ok(!rules(r).includes('property'));
});

test('overshoot at calm → overshoot violation', { skip, timeout: 60000 }, async () => {
  assert.ok(rules(await m('overshoot.html', 'calm')).includes('overshoot'));
});

test('opening exemption: 1200ms fade under data-motion=opening at calm → 0 violations', { skip, timeout: 60000 }, async () => {
  const r = await m('opening.html', 'calm', { durationMs: 1600 });
  assert.deepEqual(r.violations, []);
});

test('janky main thread → dropped > 2 and a dropped-frames violation', { skip, timeout: 60000 }, async () => {
  const r = await m('janky.html', 'calm');
  assert.ok(r.frames.dropped > 2, JSON.stringify(r.frames));
  assert.ok(rules(r).includes('dropped-frames'));
});

test('reduced motion on blur-swap → reduced-motion-ignored', { skip, timeout: 60000 }, async () => {
  assert.ok(rules(await m('blur-swap.html', 'showcase', { reducedMotion: true })).includes('reduced-motion-ignored'));
});

test('flipbook.html exists and references ≥10 frames', { skip, timeout: 60000 }, async () => {
  const r = await m('opening.html', 'calm', { durationMs: 1600 });
  assert.ok(existsSync(r.flipbook));
  const frames = JSON.parse(readFileSync(r.flipbook, 'utf8').match(/const FRAMES = (\[.*?\]);/s)[1]);
  assert.ok(frames.length >= 10, `only ${frames.length} frames`);
});

test('missing Chrome → exit 2', () => {
  const r = spawnSync(process.execPath, [join(here, '../scripts/cli.mjs'), 'motion', join(FX, 'calm-fade.html'), '--click', '#go'], { encoding: 'utf8', env: { ...process.env, CHROME_PATH: '/nonexistent' } });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Chrome not found/);
});
