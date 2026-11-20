import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, serializeFrontmatter } from '../scripts/lib/frontmatter.mjs';
import { loadContext, BASE_DIALS, profilesRoot } from '../scripts/lib/profiles.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const FX = join(here, 'fixtures/profiles');
const root = join(FX, 'root');
const projectDir = join(FX, 'proj');
const tmp = () => mkdtempSync(join(tmpdir(), 'apollo-'));

test('parseFrontmatter reads scalars, inline arrays, nested maps and block lists', () => {
  const { data, body } = parseFrontmatter('---\na: 1\nb: "x: y"\nc: [p, q]\nd:\n  e: true\nf:\n  - g\n  - h\n---\nBody');
  assert.deepEqual(data, { a: 1, b: 'x: y', c: ['p', 'q'], d: { e: true }, f: ['g', 'h'] });
  assert.equal(body, 'Body');
});

test('parseFrontmatter never throws on malformed input', () => {
  const r = parseFrontmatter('---\na: [unclosed\n  : bad\n');
  assert.ok(r.error);
  assert.deepEqual(r.data, {});
});

test('serializeFrontmatter round-trips', () => {
  const data = { kind: 'brand', dials: { motion: 'calm' }, never: ['a', 'b'], topReference: '' };
  assert.deepEqual(parseFrontmatter(serializeFrontmatter(data, 'Hi')).data, data);
});

test('profilesRoot honours APOLLO_PROFILES_DIR', () => {
  assert.equal(profilesRoot({ APOLLO_PROFILES_DIR: '/x/y' }), '/x/y');
  assert.match(profilesRoot({ HOME: '/h' }), /\/h\/\.design-profiles$/);
});

test('merges dials last-wins', () => {
  const ctx = loadContext({ projectDir, root });
  assert.equal(ctx.dials.motion, 'expressive');
  assert.equal(ctx.dials.colour, 'brand-exact');
  assert.equal(ctx.dials.creativity, 4);
  assert.equal(ctx.dials.density, BASE_DIALS.density);
  assert.equal(ctx.dials.density, 'balanced');
});

test('layer order', () => {
  const ctx = loadContext({ projectDir, root });
  assert.deepEqual(ctx.layers.map((l) => l.kind), ['base', 'personal', 'brand', 'project']);
  assert.deepEqual(ctx.layers[1].lessons, ['2026-11-01 · exits faster than entrances — fixture']);
});

test('never is a union without duplicates', () => {
  const ctx = loadContext({ projectDir, root });
  assert.deepEqual([...ctx.never].sort(), ['beige-ground', 'gradient-text', 'pulse-glow']);
});

test('topReference is the last non-empty value', () => {
  assert.equal(loadContext({ projectDir, root }).topReference, 'the brand site');
});

test('missing personal profile → notice, no throw', () => {
  const ctx = loadContext({ root: tmp() });
  assert.match(ctx.notices[0], /no personal profile/);
  assert.deepEqual(ctx.dials, BASE_DIALS);
  assert.deepEqual(ctx.layers.map((l) => l.kind), ['base']);
});

test('project names unknown brand → notice', () => {
  const p = tmp();
  mkdirSync(join(p, '.design'));
  writeFileSync(join(p, '.design/project.md'), '---\nbrands: [x]\n---\n');
  const ctx = loadContext({ projectDir: p, root });
  assert.ok(ctx.notices.some((n) => /brand "x" not found/.test(n)));
});

test('malformed front-matter → notice and that layer\'s dials ignored', () => {
  const p = tmp();
  mkdirSync(join(p, '.design'));
  writeFileSync(join(p, '.design/project.md'), '---\ndials: [oops\n  motion: showcase\n');
  const ctx = loadContext({ projectDir: p, root });
  assert.ok(ctx.notices.some((n) => /front-matter/.test(n)));
  assert.equal(ctx.dials.motion, 'calm');
});

test('invalid dial value → notice, value ignored', () => {
  const p = tmp();
  mkdirSync(join(p, '.design'));
  writeFileSync(join(p, '.design/project.md'), '---\ndials:\n  motion: wild\n  creativity: 9\n---\n');
  const ctx = loadContext({ projectDir: p, root });
  assert.equal(ctx.dials.motion, 'calm');
  assert.equal(ctx.dials.creativity, 4);
  assert.ok(ctx.notices.some((n) => /motion: wild/.test(n)));
  assert.ok(ctx.notices.some((n) => /creativity: 9/.test(n)));
});

const cli = (...a) => spawnSync(process.execPath, [join(here, '../scripts/cli.mjs'), ...a], { encoding: 'utf8', env: { ...process.env, APOLLO_PROFILES_DIR: root } });

test('context CLI --json prints Context', () => {
  const r = cli('context', '--project', projectDir, '--json');
  assert.equal(r.status, 0);
  assert.equal(JSON.parse(r.stdout).dials.motion, 'expressive');
});

test('context CLI prints Markdown by default', () => {
  const r = cli('context', '--project', projectDir);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^# Design context/);
  assert.match(r.stdout, /later layers override earlier ones/i);
});
