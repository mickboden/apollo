import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, existsSync, lstatSync, readFileSync, readlinkSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migrate, locateSkill, OVERLAPPING } from '../scripts/lib/migrate.mjs';

function fakeHome() {
  const home = realpathSync(mkdtempSync(join(tmpdir(), 'apollo-home-')));
  mkdirSync(join(home, '.claude/skills'), { recursive: true });
  mkdirSync(join(home, '.agents/skills'), { recursive: true });
  for (const name of ['emil-design-eng', 'break-ui', 'humanizer-like']) {
    mkdirSync(join(home, '.agents/skills', name));
    writeFileSync(join(home, '.agents/skills', name, 'SKILL.md'), `---\nname: ${name}\n---\n`);
  }
  symlinkSync('../../.agents/skills/emil-design-eng', join(home, '.claude/skills/emil-design-eng'));
  symlinkSync(join(home, '.agents/skills/break-ui'), join(home, '.claude/skills/break-ui'));
  mkdirSync(join(home, '.claude/skills/impeccable'));
  writeFileSync(join(home, '.claude/skills/impeccable/SKILL.md'), '---\nname: impeccable\n---\n');
  symlinkSync('../../.agents/skills/humanizer-like', join(home, '.claude/skills/humanizer-like'));
  return home;
}
const S = (home, n) => join(home, '.claude/skills', n);
const P = (home, n) => join(home, '.claude/apollo-specialists', n);

test('OVERLAPPING lists the 13 design skills', () => {
  assert.equal(OVERLAPPING.length, 13);
  assert.ok(OVERLAPPING.includes('impeccable') && OVERLAPPING.includes('emil-design-eng'));
});

test('moves all overlapping skills present and writes the manifest', () => {
  const home = fakeHome();
  const r = migrate({ home });
  assert.deepEqual(r.moved.map((m) => m.name).sort(), ['break-ui', 'emil-design-eng', 'impeccable']);
  for (const n of ['break-ui', 'emil-design-eng', 'impeccable']) { assert.ok(!existsSync(S(home, n)), n); assert.ok(existsSync(join(P(home, n), 'SKILL.md')), n); }
  assert.ok(existsSync(S(home, 'humanizer-like')), 'non-overlapping skill untouched');
  const manifest = JSON.parse(readFileSync(P(home, 'manifest.json'), 'utf8'));
  assert.equal(manifest.moved.length, 3);
});

test('relative symlinks keep working after the move', () => {
  const home = fakeHome();
  migrate({ home });
  assert.ok(lstatSync(P(home, 'emil-design-eng')).isSymbolicLink());
  assert.ok(readlinkSync(P(home, 'emil-design-eng')).startsWith('/'), 'rewritten as absolute');
  assert.ok(existsSync(join(P(home, 'emil-design-eng'), 'SKILL.md')));
});

test('second run moves nothing', () => {
  const home = fakeHome();
  migrate({ home });
  const r = migrate({ home });
  assert.deepEqual(r.moved, []);
});

test('undo restores exactly', () => {
  const home = fakeHome();
  migrate({ home });
  const r = migrate({ home, undo: true });
  assert.equal(r.moved.length, 3);
  for (const n of ['break-ui', 'emil-design-eng', 'impeccable']) assert.ok(existsSync(join(S(home, n), 'SKILL.md')), n);
  assert.ok(!existsSync(P(home, 'manifest.json')) || JSON.parse(readFileSync(P(home, 'manifest.json'), 'utf8')).moved.length === 0);
});

test('undo skips when the original path is occupied again', () => {
  const home = fakeHome();
  migrate({ home });
  mkdirSync(S(home, 'impeccable'));
  writeFileSync(join(S(home, 'impeccable'), 'SKILL.md'), 'reinstalled');
  const r = migrate({ home, undo: true });
  assert.ok(r.skipped.some((s) => s.name === 'impeccable' && /occupied/.test(s.reason)));
  assert.ok(existsSync(join(P(home, 'impeccable'), 'SKILL.md')), 'never deleted');
});

test('migrate skips when a destination already exists', () => {
  const home = fakeHome();
  mkdirSync(P(home, 'break-ui'), { recursive: true });
  const r = migrate({ home });
  assert.ok(r.skipped.some((s) => s.name === 'break-ui' && /exists/.test(s.reason)));
  assert.ok(existsSync(S(home, 'break-ui')));
});

test('dry-run changes nothing', () => {
  const home = fakeHome();
  const r = migrate({ home, dryRun: true });
  assert.equal(r.moved.length, 3);
  assert.ok(existsSync(S(home, 'impeccable')) && !existsSync(P(home, 'manifest.json')));
});

test('locate finds a skill in specialists after migrate, and in agents skills', () => {
  const home = fakeHome();
  migrate({ home });
  assert.equal(locateSkill('impeccable', { home }), P(home, 'impeccable'));
  assert.equal(locateSkill('humanizer-like', { home }), join(home, '.agents/skills/humanizer-like'));
  assert.equal(locateSkill('nope', { home }), null);
});
