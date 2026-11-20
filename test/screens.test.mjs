import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanPrivacy } from '../scripts/lib/privacy.mjs';
import { parseFrontmatter } from '../scripts/lib/frontmatter.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const S = join(here, '../skills/screens');
const files = (d) => readdirSync(d).flatMap((e) => { const p = join(d, e); return statSync(p).isDirectory() ? files(p) : [p]; });
const md = () => files(S).filter((f) => f.endsWith('.md'));

test('screens skill exists, is internal, and names itself screens', () => {
  const { data } = parseFrontmatter(readFileSync(join(S, 'SKILL.md'), 'utf8'));
  assert.equal(data.name, 'screens');
  assert.equal(data['user-invocable'], false);
  assert.match(data.description, /Director/);
});

test('no file mentions the impeccable binary or live mode', () => {
  for (const f of md()) {
    const t = readFileSync(f, 'utf8');
    assert.doesNotMatch(t, /scripts\/impeccable\b/, f);
    assert.doesNotMatch(t, /impeccable live\b|live-setup\.md|reference\/live\.md|\(live\.md\)|hooks\.md/, f);
  }
  for (const gone of ['live.md', 'live-setup.md', 'hooks.md']) assert.equal(existsSync(join(S, 'reference', gone)), false, gone);
});

test('craft-floor motion follows the motion standard, not blur', () => {
  const t = readFileSync(join(S, 'reference/craft-floor.md'), 'utf8');
  const motion = t.split('\n').find((l) => l.startsWith('- **Motion:**'));
  assert.ok(motion);
  assert.doesNotMatch(motion, /backdrop-filter|blur/);
  assert.match(motion, /motion-standard\.md/);
});

test('density, host-first and self-review are wired into the playbooks', () => {
  for (const f of ['new-work.md', 'layout.md', 'polish.md']) assert.match(readFileSync(join(S, 'reference', f), 'utf8'), /density\.md/, f);
  for (const f of ['new-work.md', 'polish.md', 'critique.md']) assert.match(readFileSync(join(S, 'reference', f), 'utf8'), /top reference/i, f);
  assert.match(readFileSync(join(S, 'reference/new-work.md'), 'utf8'), /host/i);
});

test('every relative link in skills/screens resolves', () => {
  const broken = [];
  for (const f of md()) {
    for (const m of readFileSync(f, 'utf8').matchAll(/\]\(((?!https?:|#|mailto:)[^)\s]+)\)/g)) {
      const target = resolve(dirname(f), m[1].split('#')[0]);
      if (!existsSync(target)) broken.push(`${f.replace(S, '')} → ${m[1]}`);
    }
  }
  assert.deepEqual(broken, []);
});

test('NOTICE and CHANGES exist', () => {
  assert.match(readFileSync(join(S, 'NOTICE-IMPECCABLE'), 'utf8'), /Apache License/);
  assert.ok(readFileSync(join(S, 'CHANGES.md'), 'utf8').split('\n').filter((l) => l.startsWith('- ')).length >= 6);
});

test('screens is private-clean', () => {
  assert.deepEqual(scanPrivacy(S).map((f) => `${f.rule} ${f.file}:${f.line}`), []);
});
