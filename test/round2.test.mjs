import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = (d) => readdirSync(d).flatMap((e) => { const p = join(d, e); return statSync(p).isDirectory() ? files(p) : [p]; });
const md = [...files(join(root, 'skills')), ...files(join(root, 'agents'))].filter((f) => f.endsWith('.md'));
const read = (f) => readFileSync(join(root, f), 'utf8');

// Claude Code fills in ${CLAUDE_PLUGIN_ROOT} in SKILL.md and agent bodies, but not in files read later
// with the Read tool, and does not export it to Bash. So: the variable in SKILL.md/agents only.
test('no guessed <plugin> placeholder is left in skills or agents', () => {
  for (const f of md) assert.doesNotMatch(readFileSync(f, 'utf8'), /<plugin>/, relative(root, f));
});

test('${CLAUDE_PLUGIN_ROOT} appears only where Claude Code substitutes it (SKILL.md and agents)', () => {
  for (const f of md) {
    const loadedByClaude = f.endsWith('SKILL.md') || relative(root, f).startsWith('agents');
    if (!loadedByClaude) assert.doesNotMatch(readFileSync(f, 'utf8'), /CLAUDE_PLUGIN_ROOT/, relative(root, f));
  }
});

test('both skills and every agent define the CLI with ${CLAUDE_PLUGIN_ROOT} and a fallback', () => {
  for (const f of ['skills/director/SKILL.md', 'skills/screens/SKILL.md', ...readdirSync(join(root, 'agents')).map((a) => `agents/${a}`)]) {
    const s = read(f);
    assert.match(s, /node \$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/cli\.mjs/, f);
  }
  assert.match(read('skills/director/SKILL.md'), /Outside the plugin[^\n]*two folders above[^\n]*doctor/);
});
