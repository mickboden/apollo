import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { request } from 'node:http';
import { fileURLToPath } from 'node:url';
import { startBoard, summarise } from '../board/server.mjs';
import { initProfile } from '../scripts/lib/profile-tools.mjs';
import { lintFiles } from '../scripts/lib/slop/lint.mjs';
import { renderMatrix } from '../scripts/lib/render.mjs';
import { findChrome } from '../scripts/lib/cdp.mjs';
import { BASE_DIALS } from '../scripts/lib/profiles.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const FX = join(here, 'fixtures/board');
const deckCopy = () => { const d = mkdtempSync(join(tmpdir(), 'apollo-board-')); cpSync(FX, d, { recursive: true }); return join(d, 'deck.json'); };
const post = (url, body) => fetch(new URL('/rate', url), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const rawGet = (url, path) => new Promise((res) => { const u = new URL(url); request({ host: u.hostname, port: u.port, path }, (r) => { r.resume(); res(r.statusCode); }).end(); });

test('POST /rate appends a valid line and GET /ratings reflects the last-wins state', async () => {
  const deck = deckCopy();
  const b = await startBoard(deck, { root: mkdtempSync(join(tmpdir(), 'apollo-root-')) });
  try {
    assert.equal((await post(b.url, { cardId: 'a', love: true, score: 3, note: 'nice' })).status, 200);
    assert.equal((await post(b.url, { cardId: 'a', love: true, score: 5, note: 'love it' })).status, 200);
    const lines = readFileSync(join(dirname(deck), 'ratings.jsonl'), 'utf8').trim().split('\n');
    assert.equal(lines.length, 2);
    const state = await (await fetch(new URL('/ratings', b.url))).json();
    assert.equal(state.a.score, 5);
    assert.equal(state.a.note, 'love it');
    assert.equal((await (await fetch(new URL('/deck', b.url))).json()).cards.length, 6);
  } finally { await b.close(); }
});

test('rejects score 7 and unknown cards with 400', async () => {
  const b = await startBoard(deckCopy(), {});
  try {
    assert.equal((await post(b.url, { cardId: 'a', score: 7 })).status, 400);
    assert.equal((await post(b.url, { cardId: 'zzz', score: 2 })).status, 400);
  } finally { await b.close(); }
});

test('asset path traversal → 403, answers.json never served', async () => {
  const deck = deckCopy();
  writeFileSync(join(dirname(deck), 'answers.json'), '{}');
  const b = await startBoard(deck, {});
  try {
    assert.equal(await rawGet(b.url, '/files/%2e%2e/%2e%2e/etc/passwd'), 403);
    assert.equal(await rawGet(b.url, '/files/../deck.json'), 403);
    assert.equal(await rawGet(b.url, '/files/answers.json'), 403);
    assert.equal(await rawGet(b.url, '/files/concept-a/style.css'), 200);
  } finally { await b.close(); }
});

test('refs deck with layer writes refs.jsonl in a temp root', async () => {
  const deck = deckCopy();
  const d = JSON.parse(readFileSync(deck, 'utf8'));
  writeFileSync(deck, JSON.stringify({ ...d, kind: 'refs', layer: 'personal' }));
  const root = mkdtempSync(join(tmpdir(), 'apollo-root-'));
  initProfile({ root, kind: 'personal' });
  const b = await startBoard(deck, { root });
  try {
    await post(b.url, { cardId: 'd', love: false, score: 2, note: 'too busy' });
    await post(b.url, { cardId: 'b', score: 4 });
    const refs = readFileSync(join(root, 'personal/refs.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    assert.equal(refs.length, 1);
    assert.deepEqual([refs[0].src, refs[0].love, refs[0].score, refs[0].why], ['https://www.wikipedia.org', false, 2, 'too busy']);
  } finally { await b.close(); }
});

test('summarise sorts by score', () => {
  const deck = deckCopy();
  const lines = [{ cardId: 'a', score: 2 }, { cardId: 'b', score: 5 }, { cardId: 'c', score: 4 }, { cardId: 'a', score: 3 }];
  writeFileSync(join(dirname(deck), 'ratings.jsonl'), lines.map((l) => JSON.stringify({ love: null, note: '', at: 'x', ...l })).join('\n') + '\n');
  assert.deepEqual(summarise(deck).map((r) => [r.cardId, r.score]).slice(0, 3), [['b', 5], ['c', 4], ['a', 3]]);
});

test('page passes lint', () => {
  const fails = lintFiles([join(here, '../board')], { dials: BASE_DIALS }).filter((f) => f.severity === 'fail');
  assert.deepEqual(fails, []);
});

test('page passes render', { skip: findChrome(process.env) ? false : 'Chrome not installed', timeout: 90000 }, async () => {
  const b = await startBoard(deckCopy(), {});
  try {
    const r = await renderMatrix(b.url, { outDir: mkdtempSync(join(tmpdir(), 'apollo-board-shots-')) });
    assert.deepEqual(r.findings, []);
  } finally { await b.close(); }
});
