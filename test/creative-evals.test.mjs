import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { generateCases, loadHistory, promptText, recordHistory } from '../evals/creative/generate.mjs';
import { ARTIFACTS } from '../evals/creative/axes.mjs';
import { caseDirs, caseInfo } from '../evals/lib/cases.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const tmp = () => mkdtempSync(join(tmpdir(), 'apollo-creative-'));
const strip = (cases) => JSON.stringify(cases);

test('generation is deterministic per seed', () => {
  assert.equal(strip(generateCases({ seed: 7, count: 6 })), strip(generateCases({ seed: 7, count: 6 })));
  assert.deepEqual(generateCases({ seed: 7 }).map(promptText), generateCases({ seed: 7 }).map(promptText));
});

test('different seeds give different cases, and a batch spreads across artifacts and domains', () => {
  const a = generateCases({ seed: 1 }); const b = generateCases({ seed: 2 });
  assert.notEqual(strip(a), strip(b));
  for (const batch of [a, b]) {
    assert.equal(new Set(batch.map((c) => c.axes.artifact)).size, batch.length);
    assert.equal(new Set(batch.map((c) => c.axes.domain)).size, batch.length);
  }
  const seen = new Set();
  for (let s = 1; s <= 40; s++) for (const c of generateCases({ seed: s })) seen.add(c.axes.artifact);
  assert.ok(seen.size >= ARTIFACTS.length - 1, `only ${seen.size} artifact types across 40 seeds`);
});

test('lanes are mostly New with some Refine or Fix, which get a starting fixture', () => {
  const all = Array.from({ length: 30 }, (_, i) => generateCases({ seed: i + 1 })).flat();
  const n = (l) => all.filter((c) => c.lane === l).length;
  assert.ok(n('new') / all.length > 0.6);
  assert.ok(n('refine') > 0 && n('fix') > 0);
  for (const c of all) assert.equal(!!c.fixture, c.lane !== 'new');
  for (let s = 1; s <= 10; s++) assert.ok(generateCases({ seed: s, count: 5 }).some((c) => c.lane !== 'new'), `seed ${s} has no Refine or Fix`);
});

test('prompts give facts only: no pre-filled taste answers, same output rules everywhere', () => {
  for (let s = 1; s <= 30; s++) for (const c of generateCases({ seed: s })) {
    const p = promptText(c);
    assert.doesNotMatch(p, /toned down|creativity dial|dial:\s*\d|concept pick|option pick|keep the defaults/i, c.id);
    for (const rule of ['./out/index.html', 'under 250 KB', 'Google Fonts only', 'inline SVG, CSS or data: URIs', 'Responsive']) assert.ok(p.includes(rule), `${c.id}: ${rule}`);
    assert.match(p, /Audience: .+/);
    assert.match(p, /Main action: .+/);
    assert.match(p, /is yours as the designer/);
  }
});

test('history steers later seeds away from used brands and artifact+domain pairs; re-running a seed is stable', () => {
  let history = { version: 1, entries: [] };
  const brands = new Set(); const pairs = new Set();
  for (let s = 1; s <= 8; s++) {
    const batch = generateCases({ seed: s, history });
    for (const c of batch) {
      assert.ok(!brands.has(c.axes.brand.name.toLowerCase()), `brand repeated: ${c.axes.brand.name}`);
      assert.ok(!pairs.has(`${c.axes.artifact}|${c.axes.domain}`), `pair repeated: ${c.axes.artifact}|${c.axes.domain}`);
      brands.add(c.axes.brand.name.toLowerCase()); pairs.add(`${c.axes.artifact}|${c.axes.domain}`);
    }
    history = recordHistory(history, batch);
  }
  assert.equal(history.entries.length, 40);
  assert.equal(strip(generateCases({ seed: 3, history })), strip(generateCases({ seed: 3, history: recordHistory(history, generateCases({ seed: 3, history })) })));
  assert.equal(recordHistory(history, generateCases({ seed: 3, history })).entries.length, 40, 'a re-run seed replaces its entries');
});

test('the CLI writes valid case folders and updates the history file', () => {
  const out = tmp(); const hist = join(tmp(), 'history.json');
  const r = spawnSync(process.execPath, [join(here, '../evals/creative/generate.mjs'), '--seed', '11', '--count', '5', '--out', out, '--history', hist], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim().split('\n').length, 5);
  const dirs = caseDirs(out);
  assert.equal(dirs.length, 5);
  for (const d of dirs) {
    const c = JSON.parse(readFileSync(join(out, d, 'case.json'), 'utf8'));
    assert.equal(c.id, d); assert.equal(c.seed, 11); assert.equal(c.track, 'creative');
    for (const k of ['artifact', 'domain', 'brand', 'audience', 'tone']) assert.ok(c.axes[k], `${d}: ${k}`);
    assert.match(readFileSync(join(out, d, 'prompt.md'), 'utf8'), new RegExp(`^---\\nname: ${d}\\n`));
    if (c.fixture) assert.match(readFileSync(join(out, d, c.fixture), 'utf8'), /^<!doctype html>/);
    const info = caseInfo(d, join(out, d));
    assert.equal(info.summary, c.summary);
    assert.equal(!!info.motion, !!c.motion);
  }
  assert.equal(loadHistory(hist).entries.length, 5);
});

test('motion artifacts carry a recording plan; the fixed cases keep theirs', () => {
  const all = Array.from({ length: 40 }, (_, i) => generateCases({ seed: i + 1 })).flat();
  for (const c of all.filter((x) => ['intro-animation', 'micro-interaction'].includes(x.axes.artifact) || x.axes.defect === 'stutter')) {
    assert.ok(c.motion?.durationMs > 0 && c.motion.file === 'out/index.html', c.id);
  }
  assert.ok(caseInfo('fix-stutter', null).motion);
  assert.ok(caseInfo('review-page', null).report);
});

for (const [seed, rel] of [[1, 'examples/seed-1'], [2, 'rounds/round-2']]) {
  test(`the committed seed-${seed} batch matches the generator, even after later seeds were recorded`, () => {
    const dir = join(here, '../evals/creative', rel);
    const now = generateCases({ seed, count: 5, history: loadHistory(join(here, '../evals/creative/history.json')) });
    assert.deepEqual(caseDirs(dir), now.map((c) => c.id));
    for (const c of now) assert.equal(readFileSync(join(dir, c.id, 'prompt.md'), 'utf8'), promptText(c));
  });
}

test('re-recording an early seed keeps its place, so later seeds are unchanged', () => {
  let history = { version: 1, entries: [] };
  for (const s of [1, 2, 3]) history = recordHistory(history, generateCases({ seed: s, history }));
  const again = recordHistory(history, generateCases({ seed: 1, history }));
  assert.deepEqual(again, history);
  assert.deepEqual(generateCases({ seed: 3, history: again }), generateCases({ seed: 3, history }));
});

test('eval-deck --cases-dir puts case summaries on the cards', async () => {
  const { buildBlindDeck } = await import('../scripts/lib/eval-deck.mjs');
  const { mkdirSync, writeFileSync } = await import('node:fs');
  const root = tmp();
  for (const arm of ['new', 'old']) { mkdirSync(join(root, arm, 'case-a'), { recursive: true }); writeFileSync(join(root, arm, 'case-a', 'index.html'), arm); }
  const deck = buildBlindDeck(join(root, 'new'), join(root, 'old'), { out: join(root, 'deck'), seed: 1, titles: { 'case-a': 'a one-line brief' } });
  for (const c of deck.cards) assert.equal(c.title, 'case-a: a one-line brief');
});
