import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../scripts/lib/frontmatter.mjs';
import { scanPrivacy } from '../scripts/lib/privacy.mjs';
import { COMMANDS } from '../scripts/cli.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const D = join(here, '../skills/director');
const LANES = ['tweak', 'refine', 'new', 'explore', 'fix', 'review', 'replicate'];
export const AGENTS = ['screens', 'motion', 'critic-slop', 'critic-motion', 'critic-break', 'critic-contract'];
const files = (d) => readdirSync(d).flatMap((e) => { const p = join(d, e); return statSync(p).isDirectory() ? files(p) : [p]; });
const skill = () => readFileSync(join(D, 'SKILL.md'), 'utf8');

test('SKILL.md front-matter: name director (matches its plugin folder), description ≤1024 chars', () => {
  const { data, body } = parseFrontmatter(skill());
  assert.equal(data.name, 'director');
  assert.match(data.description, /even (for )?(one-line|tiny|small)/i, 'claims small tweaks explicitly');
  assert.ok(data.description.length > 200 && data.description.length <= 1024, `${data.description.length}`);
  assert.ok(body.split('\n').length <= 260, 'SKILL.md body stays under ~250 lines');
});

test('every lane file exists and the skill links each one', () => {
  for (const l of LANES) {
    assert.ok(existsSync(join(D, 'references/lanes', `${l}.md`)), l);
    assert.match(skill(), new RegExp(`references/lanes/${l}\\.md`), `SKILL.md links ${l}`);
  }
});

test('every relative link in skills/director resolves', () => {
  const broken = [];
  for (const f of files(D).filter((x) => x.endsWith('.md'))) {
    for (const m of readFileSync(f, 'utf8').matchAll(/\]\(((?!https?:|#|mailto:)[^)\s]+)\)/g)) {
      if (!existsSync(resolve(dirname(f), m[1].split('#')[0]))) broken.push(`${f.replace(D, '')} → ${m[1]}`);
    }
  }
  assert.deepEqual(broken, []);
});

test('every CLI command named in the director exists', () => {
  for (const f of files(D).filter((x) => x.endsWith('.md'))) {
    for (const m of readFileSync(f, 'utf8').matchAll(/cli\.mjs ([a-z-]+)/g)) assert.ok(Object.hasOwn(COMMANDS, m[1]), `${f}: ${m[1]}`);
  }
});

test('every agent the director names exists', () => {
  const text = files(D).filter((x) => x.endsWith('.md')).map((f) => readFileSync(f, 'utf8')).join('\n');
  for (const a of AGENTS) {
    assert.match(text, new RegExp(`\\b${a}\\b`), `director mentions ${a}`);
    assert.ok(existsSync(join(here, '../agents', `${a}.md`)), `agents/${a}.md`);
  }
});

test('director is private-clean', () => {
  assert.deepEqual(scanPrivacy(D).map((f) => `${f.rule} ${f.file}:${f.line}`), []);
});
