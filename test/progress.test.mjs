import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startProgress, addProgress, addOverride, finishProgress, readProgress, formatProgress, clearProgress, ProgressError } from '../scripts/lib/progress.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = () => mkdtempSync(join(tmpdir(), 'apollo-prog-'));
const cli = (cwd, ...a) => spawnSync(process.execPath, [join(root, 'scripts/cli.mjs'), 'progress', ...a], { encoding: 'utf8', cwd });

test('start → add → override → done keeps lane, phase, pick, gates, findings, next and elapsed time', () => {
  const d = tmp();
  startProgress(d, { lane: 'new', request: 'A calm home screen for the ops team', budget: 20, now: '2026-01-01T10:00:00.000Z' });
  addProgress(d, { phase: 'concepts', pick: 'B, with the week line from A', next: 'write the contract', now: '2026-01-01T10:12:00.000Z' });
  addProgress(d, { phase: 'gates', gates: ['lint=passed', 'render=failed: 1 overlap'], findings: ['overlap .nav × p.last @390', 'focus ring clipped on .row'], loop: 1, now: '2026-01-01T10:30:00.000Z' });
  addProgress(d, { phase: 'fix-loop', resolved: ['focus ring'], gates: ['render=failed: 1 overlap'], now: '2026-01-01T10:35:00.000Z' });
  addOverride(d, { gate: 'render', finding: 'overlap .nav × p.last @390', reason: 'fixed bottom bar; content has matching bottom padding', now: '2026-01-01T10:36:00.000Z' });
  const s = readProgress(d);
  assert.equal(s.lane, 'New');
  assert.equal(s.phase, 'fix-loop');
  assert.equal(s.pick, 'B, with the week line from A');
  assert.equal(s.next, 'write the contract');
  assert.equal(s.loop, 1);
  assert.equal(s.gates.lint.result, 'passed');
  assert.deepEqual(s.findings, []);
  assert.equal(s.overrides.length, 1);
  assert.equal(s.log.at(-1).elapsedMin, 36);
  const md = readFileSync(join(d, '.design/progress.md'), 'utf8');
  assert.match(md, /Lane:\*\* New/);
  assert.match(md, /Overrides \(state each in the hand-over\)/);
  assert.match(md, /matching bottom padding/);
  finishProgress(d, { now: '2026-01-01T10:40:00.000Z' });
  assert.equal(readProgress(d).status, 'done');
  assert.match(formatProgress(readProgress(d)), /finished/);
});

test('elapsed time warns past twice the estimate', () => {
  const s = { status: 'running', lane: 'New', request: 'x', budgetMin: 10, startedAt: '2026-01-01T10:00:00Z', updatedAt: '2026-01-01T10:00:00Z', phase: 'build', loop: 0, gates: {}, findings: [], overrides: [], log: [] };
  assert.match(formatProgress(s, '2026-01-01T10:25:00Z'), /25 min of a 10 min estimate \(past twice/);
});

test('bad input is refused with a helpful message', () => {
  const d = tmp();
  assert.throws(() => addProgress(d, { phase: 'build' }), /no run in progress/);
  assert.throws(() => startProgress(d, { lane: 'Polish', request: 'x' }), /must be one of/);
  startProgress(d, { lane: 'Fix', request: 'nav stutters' });
  assert.throws(() => addProgress(d, { phase: 'gates', gates: ['render'] }), /name=result/);
  assert.throws(() => addOverride(d, { gate: 'render', finding: 'x', reason: 'fine' }), /in a sentence/);
  assert.throws(() => addOverride(d, { gate: 'render', finding: 'x' }), ProgressError);
});

test('a new start keeps the previous run as progress.prev.json; clear removes the state', () => {
  const d = tmp();
  startProgress(d, { lane: 'Tweak', request: 'one' });
  startProgress(d, { lane: 'Refine', request: 'two' });
  assert.equal(readProgress(d).request, 'two');
  assert.equal(JSON.parse(readFileSync(join(d, '.design/progress.prev.json'), 'utf8')).request, 'one');
  assert.equal(clearProgress(d), true);
  assert.equal(readProgress(d), null);
});

test('a corrupt progress file is reported, not crashed on', () => {
  const d = tmp(); mkdirSync(join(d, '.design')); writeFileSync(join(d, '.design/progress.json'), '{"lane": ');
  assert.throws(() => readProgress(d), /not valid JSON/);
  const r = cli(d, 'show');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /progress clear/);
});

test('cli: repeatable --gate/--finding flags, show --json, and "no run" output', () => {
  const d = tmp();
  assert.match(cli(d, 'show').stdout, /No run in progress/);
  assert.equal(cli(d, 'start', '--lane', 'Refine', '--request', 'calmer settings page', '--budget', '15').status, 0);
  const r = cli(d, 'add', '--phase', 'gates', '--gate', 'lint=passed', '--gate', 'render=failed: 2 findings', '--finding', 'a', '--finding', 'b', '--next', 'fix loop 1');
  assert.equal(r.status, 0, r.stderr);
  const s = JSON.parse(cli(d, 'show', '--json').stdout);
  assert.deepEqual(Object.keys(s.gates), ['lint', 'render']);
  assert.deepEqual(s.findings, ['a', 'b']);
  assert.match(cli(d, 'show').stdout, /Next:\*\* fix loop 1/);
  assert.equal(cli(d, 'override', '--gate', 'render', '--finding', 'a', '--reason', 'decorative overlap the design intends').status, 0);
  assert.equal(cli(d, 'frob').status, 2);
  assert.ok(existsSync(join(d, '.design/progress.md')));
});
