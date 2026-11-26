// Blind A/B decks for evals: shuffle two arms' outputs per case, keep the key out of the deck, score the ratings.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { ratingState } from '../../board/server.mjs';

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const dirs = (p) => readdirSync(p).filter((e) => statSync(join(p, e)).isDirectory()).sort();

function primaryFile(dir) {
  const files = readdirSync(dir).sort();
  if (files.includes('index.html')) return 'index.html';
  const pngs = files.filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  return pngs.find((f) => /1440-light/.test(f)) || pngs[0] || (files.includes('flipbook.html') ? 'flipbook.html' : null);
}

// titles: optional { case: one-line summary } shown on the cards (both arms of a case get the same title).
export function buildBlindDeck(newDir, oldDir, { out, seed = Date.now(), titles = {} } = {}) {
  const rand = rng(seed);
  const id = () => `k${Math.floor(rand() * 36 ** 5).toString(36).padStart(5, '0')}`;
  const arms = [{ label: basename(newDir), dir: newDir }, { label: basename(oldDir), dir: oldDir }];
  if (arms[0].label === arms[1].label) throw new Error(`both arms have the same name ("${arms[0].label}"); put them in folders with different names, for example new/ and old/`);
  mkdirSync(out, { recursive: true });
  const cards = []; const answers = {}; const notices = [];
  const oldCases = new Set(dirs(oldDir));
  for (const c of dirs(newDir)) {
    if (!oldCases.has(c)) { notices.push(`case "${c}" has no output in ${oldDir}; skipped`); continue; }
    const pair = rand() < 0.5 ? [arms[0], arms[1]] : [arms[1], arms[0]];
    for (const arm of pair) {
      const src = join(arm.dir, c);
      const file = primaryFile(src);
      if (!file) { notices.push(`case "${c}" in ${arm.dir} has nothing to show; skipped`); continue; }
      const cardId = id();
      cpSync(src, join(out, c, cardId), { recursive: true });
      cards.push({ id: cardId, title: titles[c] ? `${c}: ${titles[c]}` : c, group: c, src: `${c}/${cardId}/${file}` });
      answers[cardId] = arm.label;
    }
  }
  for (const c of dirs(oldDir)) if (!existsSync(join(newDir, c))) notices.push(`case "${c}" has no output in ${newDir}; skipped`);
  const deck = { title: 'Blind round', kind: 'blind', cards };
  writeFileSync(join(out, 'deck.json'), `${JSON.stringify(deck, null, 2)}\n`);
  writeFileSync(join(out, 'answers.json'), `${JSON.stringify({ newArm: arms[0].label, oldArm: arms[1].label, seed, cards: answers }, null, 2)}\n`);
  return { ...deck, notices };
}

export function scoreBlindDeck(out) {
  const deck = JSON.parse(readFileSync(join(out, 'deck.json'), 'utf8'));
  const key = JSON.parse(readFileSync(join(out, 'answers.json'), 'utf8'));
  const state = ratingState(join(out, 'deck.json'));
  const byCase = new Map();
  for (const c of deck.cards) {
    const arm = key.cards[c.id];
    const entry = byCase.get(c.group) || {};
    entry[arm] = state[c.id]?.score ?? null;
    byCase.set(c.group, entry);
  }
  const cases = []; const unrated = []; const sums = { [key.newArm]: [], [key.oldArm]: [] };
  const preferred = { [key.newArm]: 0, [key.oldArm]: 0, tie: 0 };
  for (const [name, s] of byCase) {
    const n = s[key.newArm]; const o = s[key.oldArm];
    if (n == null || o == null) { unrated.push(name); continue; }
    sums[key.newArm].push(n); sums[key.oldArm].push(o);
    const winner = n > o ? key.newArm : o > n ? key.oldArm : 'tie';
    preferred[winner]++;
    cases.push({ case: name, [key.newArm]: n, [key.oldArm]: o, winner });
  }
  const avg = (xs) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null);
  const averages = { [key.newArm]: avg(sums[key.newArm]), [key.oldArm]: avg(sums[key.oldArm]) };
  const total = byCase.size;
  const pass = unrated.length === 0 && averages[key.newArm] >= 4 && preferred[key.newArm] >= Math.ceil((total * 7) / 8);
  return { newArm: key.newArm, oldArm: key.oldArm, cases, unrated, averages, preferred, pass, bar: { average: 4, preferredAtLeast: Math.ceil((total * 7) / 8), of: total } };
}
