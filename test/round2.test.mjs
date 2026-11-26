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

// Round 2, speed and reliability docs: a run resumes, rigor depends on the lane, overrides are recorded,
// critics reuse gate artifacts, and specialists prevent the predictable findings while building.
test('Director resumes from and records checkpoints', () => {
  const s = read('skills/director/SKILL.md');
  assert.match(s, /cli\.mjs progress show/);
  assert.match(s, /Resuming:/);
  assert.match(s, /progress start/);
  assert.match(s, /progress add/);
  assert.match(s, /progress done/);
  assert.match(s, /progress override/);
  assert.doesNotMatch(s, /3-loop/);
});

test('gates.md sets rigor per lane, a combined critic, loop caps and overrides', () => {
  const g = read('skills/director/references/gates.md');
  assert.match(g, /## Rigor by lane/);
  for (const lane of ['Tweak', 'Fix', 'Refine', 'New', 'Explore', 'Replicate', 'Review']) assert.match(g, new RegExp(`^\\| ${lane} \\|`, 'm'), lane);
  assert.match(g, /^\| Refine \|[^\n]*combined critic[^\n]*\| 2 \|$/m);
  assert.match(g, /^\| New \|[^\n]*final build only[^\n]*\| 2 \|$/m);
  assert.match(g, /^\| Tweak \|[^\n]*\| none \| 1 \|$/m);
  assert.match(g, /## Combined critic/);
  assert.match(g, /## Overrides/);
  assert.match(g, /cli\.mjs progress override/);
  assert.match(g, /Never override[^\n]*exited 2[^\n]*brief-fit/);
  assert.doesNotMatch(g, /at most 3|3 loops|three loops/i);
});

test('lane files follow the rigor table', () => {
  const lane = (n) => read(`skills/director/references/lanes/${n}.md`);
  assert.match(lane('new'), /final build only/);
  assert.match(lane('refine'), /one combined critic/);
  assert.match(lane('fix'), /One combined critic/);
  assert.match(lane('replicate'), /one combined critic[^\n]*replica/);
  for (const n of ['new', 'refine', 'fix', 'replicate', 'review', 'tweak', 'explore']) assert.doesNotMatch(lane(n), /at most 3|3 loops|Loop at most 3/i, n);
});

test('contract has an Overrides section', () => {
  const c = read('skills/director/references/contract.md');
  assert.match(c, /### Overrides\n- render · /);
  assert.match(c, /Overrides are written down/);
});

test('critics reuse render.json and motion.json instead of measuring again', () => {
  assert.match(read('agents/critic-motion.md'), /motion\.json/);
  assert.match(read('agents/critic-break.md'), /render\.json/);
  assert.match(read('agents/critic-contract.md'), /render\.json/);
  const slop = read('agents/critic-slop.md');
  assert.match(slop, /## Combined pass/);
  for (const c of ['critic-motion.md', 'critic-break.md', 'critic-contract.md']) assert.ok(slop.includes(c), c);
  assert.match(read('skills/director/SKILL.md'), /render\.json[^\n]*motion\.json/);
});

test('specialists carry the build checklist', () => {
  const s = read('agents/screens.md');
  assert.match(s, /### Build checklist/);
  for (const needle of ['overflow-wrap: anywhere', 'min-width: 0', '40-character', ':focus-visible', 'aspect-ratio', '&nbsp;', 'text-wrap: balance', 'env(safe-area-inset-bottom)', 'scroll-padding', 'middle frame']) assert.ok(s.includes(needle), needle);
  const m = read('agents/motion.md');
  assert.match(m, /## Build checklist/);
  assert.ok(m.includes('scaleX()') && m.includes('data-motion="reveal"') && m.includes('middle frame'));
});

test('motion standard allows the one-axis reveal at calm', () => {
  const row = read('skills/director/references/motion-standard.md').split('\n').find((l) => l.startsWith('| `calm`'));
  assert.match(row, /one-axis reveal/);
  assert.match(row, /data-motion="reveal"/);
});
