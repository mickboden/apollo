import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request } from 'node:http';
import { buildBlindDeck, scoreBlindDeck } from '../scripts/lib/eval-deck.mjs';
import { startBoard } from '../board/server.mjs';

const CASES = ['home-internal-app', 'opening-animation', 'slide-master', 'landing-hero', 'fix-stutter', 'refine-more-vibey', 'replicate-ui', 'review-page'];
function arms() {
  const root = mkdtempSync(join(tmpdir(), 'apollo-evd-'));
  for (const arm of ['new', 'old']) for (const c of CASES) {
    const d = join(root, arm, c);
    mkdirSync(d, { recursive: true });
    writeFileSync(join(d, '1440-light.png'), `${arm}-${c}`);
    writeFileSync(join(d, 'notes.txt'), arm);
  }
  return { newDir: join(root, 'new'), oldDir: join(root, 'old'), out: join(root, 'deck') };
}
const rawGet = (url, path) => new Promise((res) => { const u = new URL(url); request({ host: u.hostname, port: u.port, path }, (r) => { r.resume(); res(r.statusCode); }).end(); });

test('builds a blind deck with two cards per case and hides arms', () => {
  const a = arms();
  const deck = buildBlindDeck(a.newDir, a.oldDir, { out: a.out, seed: 7 });
  assert.equal(deck.kind, 'blind');
  assert.equal(deck.cards.length, CASES.length * 2);
  for (const c of deck.cards) {
    assert.doesNotMatch(JSON.stringify(c), /\b(new|old)\b/, 'no arm name in a card');
    assert.ok(existsSync(join(a.out, c.src)), c.src);
  }
  const answers = JSON.parse(readFileSync(join(a.out, 'answers.json'), 'utf8'));
  assert.equal(Object.keys(answers.cards).length, CASES.length * 2);
  assert.equal(answers.newArm, 'new');
});

test('shuffles the arms: with a fixed seed both orders occur across 8 cases', () => {
  const a = arms();
  const deck = buildBlindDeck(a.newDir, a.oldDir, { out: a.out, seed: 42 });
  const answers = JSON.parse(readFileSync(join(a.out, 'answers.json'), 'utf8')).cards;
  const firstArms = CASES.map((c) => answers[deck.cards.find((x) => x.group === c).id]);
  assert.ok(firstArms.includes('new') && firstArms.includes('old'), firstArms.join(','));
});

test('a case missing from one arm is skipped with a notice', () => {
  const a = arms();
  mkdirSync(join(a.newDir, 'only-new'));
  writeFileSync(join(a.newDir, 'only-new', 'x.png'), 'x');
  const deck = buildBlindDeck(a.newDir, a.oldDir, { out: a.out, seed: 1 });
  assert.ok(!deck.cards.some((c) => c.group === 'only-new'));
  assert.ok(deck.notices.some((n) => /only-new/.test(n)));
});

test('answers.json is not served by the board', async () => {
  const a = arms();
  buildBlindDeck(a.newDir, a.oldDir, { out: a.out, seed: 3 });
  const b = await startBoard(join(a.out, 'deck.json'), {});
  try { assert.equal(await rawGet(b.url, '/files/answers.json'), 403); } finally { await b.close(); }
});

test('score computes averages and the pass verdict', () => {
  const a = arms();
  const deck = buildBlindDeck(a.newDir, a.oldDir, { out: a.out, seed: 5 });
  const answers = JSON.parse(readFileSync(join(a.out, 'answers.json'), 'utf8')).cards;
  const lines = deck.cards.map((c, i) => {
    const caseIdx = CASES.indexOf(c.group);
    const isNew = answers[c.id] === 'new';
    const score = isNew ? (caseIdx === 7 ? 3 : 5) : (caseIdx === 7 ? 4 : 2);
    return JSON.stringify({ cardId: c.id, love: null, score, note: '', at: `t${i}` });
  });
  writeFileSync(join(a.out, 'ratings.jsonl'), lines.join('\n') + '\n');
  const s = scoreBlindDeck(a.out);
  assert.equal(s.averages.new, 4.75);
  assert.equal(s.averages.old, 2.25);
  assert.equal(s.preferred.new, 7);
  assert.equal(s.cases.length, 8);
  assert.equal(s.pass, true);
});

test('score fails below the bar and reports unrated cases', () => {
  const a = arms();
  const deck = buildBlindDeck(a.newDir, a.oldDir, { out: a.out, seed: 9 });
  const answers = JSON.parse(readFileSync(join(a.out, 'answers.json'), 'utf8')).cards;
  const rated = deck.cards.filter((c) => c.group !== 'review-page');
  writeFileSync(join(a.out, 'ratings.jsonl'), rated.map((c) => JSON.stringify({ cardId: c.id, score: answers[c.id] === 'new' ? 4 : 4, love: null, note: '' })).join('\n') + '\n');
  const s = scoreBlindDeck(a.out);
  assert.equal(s.pass, false);
  assert.deepEqual(s.unrated, ['review-page']);
});
