import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRules } from '../scripts/lib/slop/lint.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const R = (f) => readFileSync(join(here, '../skills/director', f), 'utf8');
const A = (f) => readFileSync(join(here, '../agents', f), 'utf8');

test('base taste leads with the bold move, and removing alone is a failed refine', () => {
  const t = R('references/base-taste.md');
  const bold = t.indexOf('## 0. The bold move');
  assert.ok(bold > 0 && bold < t.indexOf('## 1.'), 'bold-move section comes first');
  assert.match(t, /only removes/i);
  assert.doesNotMatch(t, /The quietest option usually wins/);
});

test('a critic rule catches surfaces with no signature move', () => {
  const r = loadRules().find((x) => x.id === 'no-signature-move');
  assert.equal(r?.detect, 'critic');
  assert.equal(r?.severity, 'fail');
});

test('brief-fit gate: critics judge the brief words and a miss blocks hand-over', () => {
  assert.match(R('references/gates.md'), /brief-fit/i);
  assert.match(A('critic-slop.md'), /brief-fit/i);
  assert.match(R('SKILL.md'), /brief-fit/i);
});

test('openings default to showcase energy and must pass a memory test', () => {
  const m = R('references/motion-standard.md');
  assert.match(m, /Openings default to/i);
  assert.match(m, /would .* remember/i);
  assert.match(R('references/lanes/new.md'), /creativity 4/);
});

test('density has a structure floor', () => {
  assert.match(R('references/density.md'), /## Structure floor/);
});

test('review lane requires scores, a method line and P0/P1 sections, critics always', () => {
  const t = R('references/lanes/review.md');
  for (const s of ['Method:', 'P0', 'P1', '/40']) assert.ok(t.includes(s), s);
  assert.match(t, /never skip the critics/i);
});

test('routed and long work has a time budget', () => {
  assert.match(R('SKILL.md'), /## 4\. Time budget/);
  assert.match(R('SKILL.md'), /twice the estimate/i);
});

test('eval collector records motion cases as flipbooks', () => {
  const p = join(here, '../evals/collect.mjs');
  assert.ok(existsSync(p));
  const t = readFileSync(p, 'utf8');
  assert.match(t, /fix-stutter/);
  assert.match(t, /opening-animation/);
  assert.match(t, /measureMotion/);
});
