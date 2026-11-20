import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { initProfile, initProject, learn, appendRef } from '../scripts/lib/profile-tools.mjs';
import { parseFrontmatter } from '../scripts/lib/frontmatter.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const tmp = () => mkdtempSync(join(tmpdir(), 'apollo-'));
const today = new Date().toISOString().slice(0, 10);
const cli = (env, ...a) => spawnSync(process.execPath, [join(here, '../scripts/cli.mjs'), ...a], { encoding: 'utf8', env: { ...process.env, ...env } });

test('initProfile personal creates the files', () => {
  const root = tmp();
  const p = initProfile({ root, kind: 'personal' });
  assert.equal(p, join(root, 'personal/profile.md'));
  for (const f of ['profile.md', 'refs.jsonl', 'ratings.jsonl', 'lessons.md']) assert.ok(existsSync(join(root, 'personal', f)), f);
  const { data, body } = parseFrontmatter(readFileSync(p, 'utf8'));
  assert.equal(data.kind, 'personal');
  assert.deepEqual(data.never, []);
  assert.match(body, /## References/);
  assert.doesNotMatch(body, /## Brand values/);
});

test('initProfile brand writes into brands/<name> with brand values section', () => {
  const root = tmp();
  const p = initProfile({ root, kind: 'brand', name: 'northwind' });
  assert.equal(p, join(root, 'brands/northwind/profile.md'));
  assert.match(readFileSync(p, 'utf8'), /## Brand values/);
});

test('initProfile twice exits 1', () => {
  const root = tmp();
  assert.equal(cli({ APOLLO_PROFILES_DIR: root }, 'profile', 'init', 'personal').status, 0);
  const r = cli({ APOLLO_PROFILES_DIR: root }, 'profile', 'init', 'personal');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /exists/);
});

test('initProject adds .design/ to .gitignore exactly once', () => {
  const p = tmp();
  writeFileSync(join(p, '.gitignore'), 'node_modules/\n');
  initProject({ projectDir: p, brands: ['a'], commit: false });
  initProject({ projectDir: p, brands: ['a'], commit: false });
  const lines = readFileSync(join(p, '.gitignore'), 'utf8').split('\n').filter((l) => l.trim() === '.design/');
  assert.equal(lines.length, 1);
  assert.deepEqual(parseFrontmatter(readFileSync(join(p, '.design/project.md'), 'utf8')).data.brands, ['a']);
  assert.ok(existsSync(join(p, '.design/contract.md')));
});

test('initProject keeps an existing project.md', () => {
  const p = tmp();
  initProject({ projectDir: p, brands: ['a'], commit: false });
  writeFileSync(join(p, '.design/project.md'), '---\nbrands: [kept]\n---\n');
  initProject({ projectDir: p, brands: ['b'], commit: false });
  assert.match(readFileSync(join(p, '.design/project.md'), 'utf8'), /kept/);
});

test('initProject --commit leaves .gitignore untouched', () => {
  const p = tmp();
  initProject({ projectDir: p, brands: [], commit: true });
  assert.equal(existsSync(join(p, '.gitignore')), false);
});

test('learn appends to the right file per layer', () => {
  const root = tmp();
  const proj = tmp();
  initProfile({ root, kind: 'personal' });
  initProfile({ root, kind: 'brand', name: 'x' });
  initProject({ projectDir: proj, brands: ['x'], commit: true });
  const cases = [
    ['project', join(proj, '.design/lessons.md')],
    ['personal', join(root, 'personal/lessons.md')],
    ['brand:x', join(root, 'brands/x/lessons.md')],
    ['suggest-base', join(root, 'suggested-base.md')],
  ];
  for (const [layer, file] of cases) {
    const p = learn({ layer, rule: `rule for ${layer}`, evidence: 'ev', projectDir: proj, root });
    assert.equal(p, file);
    assert.match(readFileSync(file, 'utf8'), new RegExp(`- ${today} · rule for ${layer} — ev`));
  }
});

test('learn on a missing brand exits 1', () => {
  const root = tmp();
  const r = cli({ APOLLO_PROFILES_DIR: root }, 'learn', '--layer', 'brand:x', '--rule', 'r');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /brand "x" not found/);
});

test('appendRef writes a ref line to a layer refs.jsonl', () => {
  const root = tmp();
  initProfile({ root, kind: 'personal' });
  appendRef({ root, layer: 'personal', ref: { src: 'https://a.test', title: 'A', love: true, score: 5, why: 'calm' } });
  const line = JSON.parse(readFileSync(join(root, 'personal/refs.jsonl'), 'utf8').trim());
  assert.equal(line.src, 'https://a.test');
  assert.ok(line.at);
});
