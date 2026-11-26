import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { lintFiles, loadRules } from '../scripts/lib/slop/lint.mjs';
import { BASE_DIALS } from '../scripts/lib/profiles.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'apollo-lint-'));
const calm = { ...BASE_DIALS };
const showcase = { ...BASE_DIALS, motion: 'showcase' };

const write = (name, content) => { const p = join(dir, name); writeFileSync(p, content); return p; };
const only = (findings, rule) => findings.filter((f) => f.rule === rule);

const CASES = [
  ['beige-ground', 'fail', 'a.css', '.x { color: #111; }\nbody { background: #F3EEE3; }', 2],
  ['beige-ground', 'fail', 'a2.css', '.y {\n  background-color: hsl(40, 30%, 92%);\n}', 2],
  ['gradient-text', 'fail', 'b.css', 'h1 {\n  -webkit-background-clip: text;\n}', 2],
  ['side-stripe', 'fail', 'c.css', '.callout { border-left: 4px solid #2F5BEA; }', 1],
  ['overshoot-easing', 'fail', 'd.css', '.p { transition: transform 300ms cubic-bezier(.24,1.34,.38,1); }', 1],
  ['blur-motion', 'fail', 'e.css', '@keyframes swap {\n  from { filter: blur(6px); }\n  to { filter: blur(0); }\n}', 2],
  ['slide-swap', 'warn', 'f.css', '@keyframes in {\n  from { transform: translateX(24px); }\n  to { transform: none; }\n}', 2],
  ['transition-all', 'warn', 'g.css', '.b { transition: all 200ms ease; }', 1],
  ['outline-removed', 'warn', 'g2.css', '.row:focus:not(:focus-visible) { outline: none; }\n.row:focus { outline: none; }', 2],
  ['pulse-glow', 'fail', 'h.css', '@keyframes pulse-dot { 50% { opacity: .4 } }', 1],
  ['pure-black-ink', 'warn', 'i.css', 'p { color: #000; }', 1],
  ['hard-offset-shadow', 'fail', 'j.css', '.card { box-shadow: 4px 4px 0 #000; }', 1],
  ['eyebrow-label', 'fail', 'k.html', '<p class="eyebrow">New</p>\n<h1>Title</h1>', 1],
  ['filler-copy', 'fail', 'l.html', '<h1>Title</h1>\n<p>Elevate your workflow with seamless sync.</p>', 2],
  ['placeholder-data', 'fail', 'm.jsx', 'export const Row = () => (\n  <td>John Doe</td>\n);', 2],
  ['emoji-icon', 'warn', 'n.html', '<button>🚀 Launch</button>', 1],
];

for (const [rule, severity, file, content, line] of CASES) {
  test(`${rule} fires in ${file}`, () => {
    const hits = only(lintFiles([write(file, content)], { dials: calm }), rule);
    assert.equal(hits.length, 1, JSON.stringify(hits));
    assert.equal(hits[0].severity, severity);
    assert.equal(hits[0].line, line);
    assert.ok(hits[0].why);
  });
}

test('clean fixtures have zero findings', () => {
  const f = lintFiles([join(here, 'fixtures/slop/clean.css'), join(here, 'fixtures/slop/clean.html')], { dials: calm });
  assert.deepEqual(f, []);
});

test('blur-motion fires at calm and not at showcase', () => {
  const p = write('blur2.css', '.v { transition: filter 200ms; }\n@keyframes s { from { backdrop-filter: blur(4px) } }');
  assert.ok(only(lintFiles([p], { dials: calm }), 'blur-motion').length >= 1);
  assert.equal(only(lintFiles([p], { dials: showcase }), 'blur-motion').length, 0);
});

test('overshoot-easing is silent at showcase', () => {
  const p = write('o.css', '.p { transition: transform 300ms cubic-bezier(.24,1.34,.38,1); }');
  assert.equal(only(lintFiles([p], { dials: showcase }), 'overshoot-easing').length, 0);
});

test('never-list raises a warn rule to fail', () => {
  const p = write('t.css', '.b { transition: all 200ms ease; }');
  assert.equal(only(lintFiles([p], { dials: calm, never: ['transition-all'] }), 'transition-all')[0].severity, 'fail');
});

test('folders are walked for supported extensions only', () => {
  const sub = mkdtempSync(join(tmpdir(), 'apollo-walk-'));
  writeFileSync(join(sub, 'x.css'), 'h1 { background-clip: text; }');
  writeFileSync(join(sub, 'x.txt'), 'h1 { background-clip: text; }');
  assert.equal(lintFiles([sub], { dials: calm }).length, 1);
});

test('rules.json validates', () => {
  const rules = loadRules();
  const ids = rules.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, 'unique ids');
  for (const r of rules) {
    assert.ok(r.title && r.why && ['fail', 'warn'].includes(r.severity), r.id);
    if (r.detect === 'critic') assert.equal(r.matcher, undefined, `${r.id} critic rule has no matcher`);
    else assert.ok(r.matcher?.kind, `${r.id} lint rule has a matcher`);
  }
  for (const id of CASES.map((c) => c[0])) assert.ok(ids.includes(id), id);
  for (const id of ['card-wash', 'vibe-layer', 'close-copy', 'pasted-treatment', 'half-real-imagery', 'default-selectors', 'same-size-card-grid', 'hero-metric-template']) {
    assert.equal(rules.find((r) => r.id === id)?.detect, 'critic', id);
  }
});

test('lint CLI exits 1 on fail findings and 0 when clean', () => {
  const run = (p) => spawnSync(process.execPath, [join(here, '../scripts/cli.mjs'), 'lint', p, '--json'], { encoding: 'utf8', env: { ...process.env, APOLLO_PROFILES_DIR: dir } });
  assert.equal(run(join(here, 'fixtures/slop/clean.css')).status, 0);
  const r = run(write('z.css', 'h1 { background-clip: text; }'));
  assert.equal(r.status, 1);
  assert.equal(JSON.parse(r.stdout)[0].rule, 'gradient-text');
});
