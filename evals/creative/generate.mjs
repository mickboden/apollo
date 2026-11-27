#!/usr/bin/env node
// Compose fresh creative A/B cases from the axes in axes.mjs. Same seed + same history = same cases.
//
//   node evals/creative/generate.mjs --seed <n> [--count 5] [--out <dir>] [--history <file> | --no-history]
//
// Without --out it only prints the one-line summaries. With --out it writes <dir>/<case>/prompt.md,
// case.json and, for Refine and Fix, fixtures/site/index.html, then records the batch in the history
// file (default evals/creative/history.json) so later seeds avoid the same brands and combinations.
// Only entries recorded before the seed's own count when generating, so re-running any seed, even after later
// seeds were added, gives the same batch.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARTIFACTS, CONSTRAINTS, DEFECTS, DOMAINS, NAME_PARTS, QUIRKS, REFINE_ASKS, TONES } from './axes.mjs';
import { fixtureHtml } from './fixture.mjs';
import { pick, pickLeastUsed, rng, shuffle } from '../lib/rng.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_HISTORY = join(HERE, 'history.json');
const LANE_LABEL = { new: 'New', refine: 'Refine', fix: 'Fix' };

export function loadHistory(path) {
  if (!path || !existsSync(path)) return { version: 1, entries: [] };
  const h = JSON.parse(readFileSync(path, 'utf8'));
  return { version: 1, entries: Array.isArray(h.entries) ? h.entries : [] };
}

// A re-recorded seed keeps its place in the history, so later seeds still come after it.
export function recordHistory(history, cases) {
  const seeds = new Set(cases.map((c) => c.seed));
  const first = history.entries.findIndex((e) => seeds.has(e.seed));
  const at = first === -1 ? history.entries.length : first;
  const before = history.entries.slice(0, at).filter((e) => !seeds.has(e.seed));
  const after = history.entries.slice(at).filter((e) => !seeds.has(e.seed));
  const added = cases.map((c) => ({ seed: c.seed, id: c.id, lane: c.lane, artifact: c.axes.artifact, domain: c.axes.domain, tone: c.axes.tone, constraint: c.axes.constraint, brand: c.axes.brand.name }));
  return { version: 1, entries: [...before, ...added, ...after] };
}

// The entries a seed is generated against: those recorded before its own first entry (all of them for a new seed).
export function historyBefore(history, seed) {
  const first = history.entries.findIndex((e) => e.seed === seed);
  return (first === -1 ? history.entries : history.entries.slice(0, first)).filter((e) => e.seed !== seed);
}

export function brandName(rand) {
  const { onsets, vowels, codas, soft, tails, endings, suffixes } = NAME_PARTS;
  const head = pick(rand, onsets) + pick(rand, vowels);
  const stem = rand() < 0.5 ? head + pick(rand, codas) + pick(rand, endings) : head + pick(rand, soft) + pick(rand, tails);
  const word = stem.replace(/(.)\1\1+/g, '$1$1').replace(/ii+/g, 'i');
  return word.charAt(0).toUpperCase() + word.slice(1) + pick(rand, suffixes);
}

function laneSlots(rand, count) {
  const lanes = Array(count).fill('new');
  const nonNew = count >= 3 ? Math.max(1, Math.round(count * 0.25)) : lanes.filter(() => rand() < 0.2).length;
  for (const i of shuffle(rand, [...lanes.keys()]).slice(0, nonNew)) lanes[i] = rand() < 0.5 ? 'refine' : 'fix';
  return lanes;
}

export function generateCases({ seed, count = 5, history = { entries: [] } } = {}) {
  if (!Number.isInteger(seed)) throw new Error('seed must be an integer');
  const rand = rng(seed);
  const past = historyBefore(history, seed);
  const used = { artifact: new Map(), domain: new Map(), tone: new Map() };
  for (const e of past) for (const k of Object.keys(used)) used[k].set(e[k], (used[k].get(e[k]) || 0) + 1);
  const usedPairs = new Set(past.map((e) => `${e.artifact}|${e.domain}`));
  const usedBrands = new Set(past.map((e) => e.brand.toLowerCase()));
  const batch = { artifacts: new Set(), domains: new Set(), tones: new Set(), constraints: new Set() };
  const cases = [];

  laneSlots(rand, count).forEach((lane, i) => {
    let artifacts = ARTIFACTS.filter((a) => a.lanes.includes(lane) && !batch.artifacts.has(a.id));
    if (!artifacts.length) artifacts = ARTIFACTS.filter((a) => a.lanes.includes(lane));
    const artifact = pickLeastUsed(rand, artifacts, (a) => used.artifact.get(a.id) || 0);
    let domains = DOMAINS.filter((d) => !batch.domains.has(d.id) && !usedPairs.has(`${artifact.id}|${d.id}`));
    if (!domains.length) domains = DOMAINS.filter((d) => !batch.domains.has(d.id));
    if (!domains.length) domains = DOMAINS;
    const domain = pickLeastUsed(rand, domains, (d) => used.domain.get(d.id) || 0);
    const tones = TONES.filter((t) => !batch.tones.has(t));
    const tone = pickLeastUsed(rand, tones.length ? tones : TONES, (t) => used.tone.get(t) || 0);
    const constraints = CONSTRAINTS.filter((c) => !batch.constraints.has(c));
    const constraint = lane !== 'fix' && rand() < 0.5 ? pick(rand, constraints.length ? constraints : CONSTRAINTS) : null;
    let name = brandName(rand);
    for (let tries = 0; usedBrands.has(name.toLowerCase()) && tries < 200; tries++) name = brandName(rand);
    usedBrands.add(name.toLowerCase());
    const quirk = pick(rand, QUIRKS);
    const audience = pick(rand, domain.audiences);
    const defect = lane === 'fix' ? pick(rand, DEFECTS) : null;
    const refineAsk = lane === 'refine' ? Math.floor(rand() * REFINE_ASKS.length) : null;
    const lengthS = artifact.id === 'intro-animation' ? pick(rand, [2, 3, 4, 5, 6]) : null;
    for (const [k, v] of [['artifacts', artifact.id], ['domains', domain.id], ['tones', tone]]) batch[k].add(v);
    if (constraint) batch.constraints.add(constraint);

    const id = `s${seed}-${String(i + 1).padStart(2, '0')}-${artifact.id}`;
    const premise = `${name} ${domain.premise}.`;
    const motion = defect?.motion ? { ...defect.motion }
      : artifact.motion ? { file: 'out/index.html', ...artifact.motion, ...(lengthS && { durationMs: lengthS * 1000 + 1500 }) } : null;
    const c = {
      id, seed, index: i + 1, track: 'creative', lane,
      axes: { artifact: artifact.id, domain: domain.id, brand: { name, premise }, quirk, audience, tone, constraint, ...(defect && { defect: defect.id }), ...(refineAsk !== null && { refineAsk }), ...(lengthS && { lengthS }) },
      ...(motion && { motion }),
      output: 'out/index.html',
      fixture: lane === 'new' ? null : 'fixtures/site/index.html',
    };
    c.summary = summaryLine(c);
    cases.push(c);
  });
  return cases;
}

const byId = (xs, id) => xs.find((x) => x.id === id);
const list = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}` : xs[0]);

export function summaryLine(c) {
  const a = byId(ARTIFACTS, c.axes.artifact); const d = byId(DOMAINS, c.axes.domain);
  const parts = [`[${LANE_LABEL[c.lane]}] ${a.label}`, `${c.axes.brand.name} (${d.field})`, `for ${c.axes.audience}`, c.axes.tone];
  if (c.axes.constraint) parts.push(`constraint: ${c.axes.constraint.split(':')[0]}`);
  if (c.axes.defect) parts.push(`defect: ${c.axes.defect}`);
  return parts.join(' · ');
}

export function promptText(c) {
  const a = byId(ARTIFACTS, c.axes.artifact); const d = byId(DOMAINS, c.axes.domain);
  const b = c.axes.brand.name;
  let ask;
  if (c.lane === 'new') ask = `${a.ask(`"${b}"`)} Output ./out/index.html.`;
  else {
    const req = c.lane === 'fix' ? byId(DEFECTS, c.axes.defect).ask : REFINE_ASKS[c.axes.refineAsk](`"${b}"`);
    ask = `${req}\n\nThe current page is ./site/index.html (the ${a.label}). Leave it as it is and write the result to ./out/index.html.`;
  }
  const facts = [
    `Brand: ${c.axes.brand.premise} ${c.axes.quirk} (Fictional.)`,
    `Audience: ${c.axes.audience}.`,
    `Main action: ${d.action}.`,
    ...(c.lane !== 'new' ? [] : a.context ? [`What the brand deals with: ${list(d.content)}.`] : [`Content to include: ${list(d.content)}.`]),
    `Personality: ${c.axes.tone}.`,
    ...(c.axes.constraint ? [`Constraint: ${c.axes.constraint}.`] : []),
    ...(c.axes.lengthS ? [`Length: it plays once and lasts at most ${c.axes.lengthS} seconds.`] : []),
  ];
  const rules = [
    'One self-contained file, ./out/index.html, under 250 KB, with its CSS and JS inline.',
    'Fonts from Google Fonts only.',
    'Images only as inline SVG, CSS or data: URIs; no other image files and no links to images.',
    'Responsive from a 390px phone to a 1440px desktop.',
    ...(a.extra && c.lane === 'new' ? [a.extra] : []),
  ];
  return `---
name: ${c.id}
tags: [creative]
runs: 1
max_turns: 120
timeout_seconds: 4500
---
${ask}

This is an unattended evaluation run. Nobody will answer questions or rate a board. Where you would ask the person for facts, use the facts below. Every other decision (concept, direction, references, dials) is yours as the designer: make it and continue. Do not push, deploy or publish anything.

Facts:
${facts.map((f) => `- ${f}`).join('\n')}

Output rules:
${rules.map((r) => `- ${r}`).join('\n')}
`;
}

export function writeCases(cases, outDir) {
  mkdirSync(outDir, { recursive: true });
  for (const c of cases) {
    const dir = join(outDir, c.id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'prompt.md'), promptText(c));
    writeFileSync(join(dir, 'case.json'), `${JSON.stringify(c, null, 2)}\n`);
    if (c.fixture) {
      mkdirSync(join(dir, 'fixtures', 'site'), { recursive: true });
      const artifact = byId(ARTIFACTS, c.axes.artifact); const domain = byId(DOMAINS, c.axes.domain);
      writeFileSync(join(dir, c.fixture), fixtureHtml({ artifact, brand: c.axes.brand, domain, defect: c.axes.defect }));
    }
  }
  writeFileSync(join(outDir, 'batch.json'), `${JSON.stringify({ seed: cases[0]?.seed, count: cases.length, cases: cases.map((c) => ({ id: c.id, summary: c.summary })) }, null, 2)}\n`);
}

async function main(argv) {
  const { parseArgs } = await import('../../scripts/lib/args.mjs');
  const { flags } = parseArgs(argv, { string: ['seed', 'count', 'out', 'history'], boolean: ['no-history', 'json'] });
  const seed = Number(flags.seed);
  if (flags.seed === undefined || !Number.isInteger(seed)) { console.error('Usage: node evals/creative/generate.mjs --seed <n> [--count 5] [--out <dir>] [--history <file> | --no-history] [--json]'); return 2; }
  const historyPath = flags['no-history'] ? null : resolve(flags.history || DEFAULT_HISTORY);
  const history = loadHistory(historyPath);
  const cases = generateCases({ seed, count: Number(flags.count || 5), history });
  if (flags.out) {
    writeCases(cases, resolve(flags.out));
    if (historyPath) writeFileSync(historyPath, `${JSON.stringify(recordHistory(history, cases), null, 2)}\n`);
  }
  if (flags.json) console.log(JSON.stringify(cases, null, 2));
  else for (const c of cases) console.log(`${c.id.padEnd(28)} ${c.summary}`);
  if (flags.out) console.error(`wrote ${cases.length} cases to ${flags.out}${historyPath ? `; history updated (${historyPath})` : ''}`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
