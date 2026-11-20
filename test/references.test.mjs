import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRules } from '../scripts/lib/slop/lint.mjs';
import { COMMANDS } from '../scripts/cli.mjs';
import { DIAL_OPTIONS } from '../scripts/lib/profiles.mjs';
import { scanPrivacy } from '../scripts/lib/privacy.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const REF = join(here, '../skills/director/references');
const read = (f) => readFileSync(join(REF, f), 'utf8');
const FILES = ['base-taste', 'slop-list', 'motion-standard', 'density', 'copy', 'dials', 'contract', 'gates', 'profiles', 'board', 'upstream'];

test('every reference file exists and is substantial', () => {
  for (const f of FILES) {
    assert.ok(existsSync(join(REF, `${f}.md`)), f);
    assert.ok(read(`${f}.md`).length > 800, `${f}.md is too thin`);
  }
});

test('slop-list.md headings mirror rules.json ids', () => {
  const ids = loadRules().map((r) => r.id).sort();
  const heads = [...read('slop-list.md').matchAll(/^### ([a-z0-9-]+)\s*$/gm)].map((m) => m[1]).sort();
  assert.deepEqual(heads, ids);
});

test('every CLI command named in gates.md exists', () => {
  const named = [...read('gates.md').matchAll(/cli\.mjs ([a-z-]+)/g)].map((m) => m[1]);
  assert.ok(named.length >= 4);
  for (const c of named) assert.ok(Object.hasOwn(COMMANDS, c), c);
});

test('dials.md names every enum value', () => {
  const t = read('dials.md');
  for (const [k, vals] of Object.entries(DIAL_OPTIONS)) {
    assert.match(t, new RegExp(`\\b${k}\\b`), k);
    for (const v of vals) assert.match(t, new RegExp(`\`${v}\``), `${k}: ${v}`);
  }
});

test('motion-standard.md carries the exact numbers', () => {
  const t = read('motion-standard.md');
  for (const s of ['cubic-bezier(.22,1,.36,1)', '140', '240', '.97', '.99', 'data-motion="reveal"', 'data-motion="opening"', '3000']) assert.ok(t.includes(s), s);
});

test('references are private-clean', () => {
  assert.deepEqual(scanPrivacy(join(here, '../skills')).map((f) => `${f.rule} ${f.file}:${f.line}`), []);
});
