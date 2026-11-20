import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../scripts/lib/frontmatter.mjs';
import { scanPrivacy } from '../scripts/lib/privacy.mjs';
import { COMMANDS } from '../scripts/cli.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const A = join(here, '../agents');
const MUST_RUN = {
  screens: ['context', 'lint', 'render'],
  motion: ['motion'],
  'critic-slop': ['lint'],
  'critic-motion': ['motion'],
  'critic-break': ['render'],
  'critic-contract': ['render'],
};
const toolsOf = (data) => (Array.isArray(data.tools) ? data.tools : String(data.tools || '').split(',')).map((t) => t.trim()).filter(Boolean);

for (const [name, cmds] of Object.entries(MUST_RUN)) {
  test(`${name}: valid front-matter and names its CLI commands`, () => {
    const p = join(A, `${name}.md`);
    assert.ok(existsSync(p), p);
    const { data, body, error } = parseFrontmatter(readFileSync(p, 'utf8'));
    assert.equal(error, undefined);
    assert.equal(data.name, name);
    assert.ok(data.description && data.description.length > 60, 'description');
    assert.ok(toolsOf(data).length > 0, 'tools');
    for (const c of cmds) assert.match(body, new RegExp(`cli\\.mjs ${c}\\b`), `${name} runs ${c}`);
    for (const m of body.matchAll(/cli\.mjs ([a-z-]+)/g)) assert.ok(Object.hasOwn(COMMANDS, m[1]), m[1]);
    assert.ok(body.length > 1500, 'brief is substantial');
  });
}

test('critics cannot edit or write', () => {
  for (const name of Object.keys(MUST_RUN).filter((n) => n.startsWith('critic-'))) {
    const tools = toolsOf(parseFrontmatter(readFileSync(join(A, `${name}.md`), 'utf8')).data);
    assert.ok(!tools.includes('Edit') && !tools.includes('Write'), `${name}: ${tools}`);
  }
});

test('specialists can edit and write', () => {
  for (const name of ['screens', 'motion']) {
    const tools = toolsOf(parseFrontmatter(readFileSync(join(A, `${name}.md`), 'utf8')).data);
    assert.ok(tools.includes('Edit') && tools.includes('Write'), name);
  }
});

test('agents are private-clean', () => {
  assert.deepEqual(scanPrivacy(A).map((f) => `${f.rule} ${f.file}:${f.line}`), []);
});
