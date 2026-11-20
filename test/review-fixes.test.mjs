import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync, symlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { renderMatrix } from '../scripts/lib/render.mjs';
import { findChrome, TargetError } from '../scripts/lib/cdp.mjs';
import { startBoard } from '../board/server.mjs';
import { initProfile, initProject } from '../scripts/lib/profile-tools.mjs';
import { scanPrivacy } from '../scripts/lib/privacy.mjs';
import { lintFiles } from '../scripts/lib/slop/lint.mjs';
import { BASE_DIALS } from '../scripts/lib/profiles.mjs';
import { buildBlindDeck } from '../scripts/lib/eval-deck.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const skip = findChrome(process.env) ? false : 'Chrome not installed';
const tmp = (p = 'apollo-rf-') => mkdtempSync(join(tmpdir(), p));
const listen = (handler) => new Promise((res) => { const s = createServer(handler); s.listen(0, '127.0.0.1', () => res({ s, url: `http://127.0.0.1:${s.address().port}` })); });

// C1
const chromesIn = (dir) => { try { return execSync(`pgrep -f '${dir}' | wc -l`, { encoding: 'utf8' }).trim() * 1; } catch { return 0; } };

test('C1: refused port → render exits 2 quickly with "not run", no Chrome left', { skip, timeout: 30000 }, () => {
  const own = tmp('apollo-own-');
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [join(here, '../scripts/cli.mjs'), 'render', 'http://127.0.0.1:1/', '--out', tmp()], { encoding: 'utf8', env: { ...process.env, TMPDIR: own } });
  assert.equal(r.status, 2, r.stderr);
  assert.match(r.stderr, /render not run/);
  assert.ok(Date.now() - t0 < 15000);
  const deadline = Date.now() + 2000;
  while (chromesIn(own) > 0 && Date.now() < deadline) execSync('sleep 0.1');
  assert.equal(chromesIn(own), 0, 'no surviving Chrome');
});

test('C1: a server that never answers → TargetError after the nav timeout, no Chrome left', { skip, timeout: 30000 }, async () => {
  const { s, url } = await listen(() => {});
  try {
    await assert.rejects(renderMatrix(url, { outDir: tmp(), widths: [390], themes: ['light'], zoom: [], navTimeoutMs: 1500 }), (e) => e instanceof TargetError && /did not finish loading/.test(e.message));
  } finally { s.closeAllConnections(); s.close(); }
});

// I1
test('I1: a 404 target is "not run", not passed', { skip, timeout: 30000 }, async () => {
  const { s, url } = await listen((req, res) => { res.writeHead(404, { 'content-type': 'text/html' }); res.end('<h1>Not found</h1>'); });
  try { await assert.rejects(renderMatrix(`${url}/typo`, { outDir: tmp(), widths: [390], themes: ['light'], zoom: [] }), (e) => e instanceof TargetError && /404/.test(e.message)); }
  finally { s.close(); }
});

// I2 + M1
const FX = join(here, 'fixtures/board');
const deckCopy = () => { const d = tmp('apollo-board-'); cpSync(FX, d, { recursive: true }); return join(d, 'deck.json'); };
const raw = (url, path, { method = 'GET', headers = {}, body } = {}) => new Promise((res) => { const u = new URL(url); const rq = request({ host: u.hostname, port: u.port, path, method, headers }, (r) => { r.resume(); res(r.statusCode); }); if (body) rq.write(body); rq.end(); });

test('I2: case variants of private files and symlinks out of the deck are refused', async () => {
  const deck = deckCopy();
  writeFileSync(join(dirname(deck), 'answers.json'), '{}');
  writeFileSync(join(dirname(deck), 'ratings.jsonl'), '');
  symlinkSync('/etc/hosts', join(dirname(deck), 'link.txt'));
  const b = await startBoard(deck, {});
  try {
    for (const p of ['/files/ANSWERS.JSON', '/files/Answers.json', '/files/Ratings.JSONL', '/files/DECK.json', '/files/link.txt']) assert.equal(await raw(b.url, p), 403, p);
  } finally { await b.close(); }
});

test('M1: /rate requires JSON and a local Host', async () => {
  const b = await startBoard(deckCopy(), {});
  const body = JSON.stringify({ cardId: 'a', score: 3 });
  try {
    assert.equal(await raw(b.url, '/rate', { method: 'POST', headers: { 'content-type': 'text/plain' }, body }), 415);
    assert.equal(await raw(b.url, '/rate', { method: 'POST', headers: { 'content-type': 'application/json', host: 'evil.test' }, body }), 403);
    assert.equal(await raw(b.url, '/rate', { method: 'POST', headers: { 'content-type': 'application/json' }, body }), 200);
  } finally { await b.close(); }
});

// M2
test('M2: concept iframes are sandboxed without same-origin', () => {
  const js = readFileSync(join(here, '../board/page.js'), 'utf8');
  assert.doesNotMatch(js, /allow-same-origin/);
});

// I3
test('I3: denylist words match inside identifiers and paths; private URLs flag', () => {
  const d = tmp();
  const deny = join(d, 'deny.txt'); writeFileSync(deny, 'acmecorp\n');
  const pkg = join(d, 'pkg'); mkdirSync(join(pkg, 'acmecorp-assets'), { recursive: true });
  writeFileSync(join(pkg, 'acmecorp-assets', 'x.txt'), 'nothing here');
  writeFileSync(join(pkg, 'a.css'), ':root { --acmecorp-ink: #111; }\n.x { color: var(--acmecorpBlue); }\n');
  const figma = 'https://www.figma' + '.com/design/AbC123/File'; const vercel = 'https://my-app.vercel' + '.app/admin';
  writeFileSync(join(pkg, 'b.md'), `See ${figma} and ${vercel}\nlocal http://localhost:5173/\n`);
  const f = scanPrivacy(pkg, { denylistPath: deny });
  const by = (rule) => f.filter((x) => x.rule === rule);
  assert.equal(by('denylist').filter((x) => x.file === 'a.css').length, 2);
  assert.ok(by('denylist').some((x) => /acmecorp-assets/.test(x.file) && x.line === 0), 'path is scanned');
  assert.equal(by('private-url').length, 1, 'figma + vercel on one line; localhost is not private');
  assert.ok(!by('private-url').some((x) => x.line === 2));
});

test('I3: allowlist lets a known-safe word through', () => {
  const d = tmp();
  const deny = join(d, 'deny.txt'); writeFileSync(deny, 'jan\n');
  const allow = join(d, 'allow.txt'); writeFileSync(allow, 'january\n');
  const pkg = join(d, 'pkg'); mkdirSync(pkg); writeFileSync(join(pkg, 'a.md'), 'Released in January.\nThanks Jan.\n');
  assert.deepEqual(scanPrivacy(pkg, { denylistPath: deny, allowlistPath: allow }).map((x) => x.line), [2]);
});

// I4
test('I4: a refs deck with layer project writes into the project .design/refs.jsonl', async () => {
  const proj = tmp();
  initProject({ projectDir: proj, brands: [], commit: true });
  const deckDir = join(proj, '.design/board/r1');
  mkdirSync(deckDir, { recursive: true });
  cpSync(FX, deckDir, { recursive: true });
  const deck = join(deckDir, 'deck.json');
  const d = JSON.parse(readFileSync(deck, 'utf8'));
  writeFileSync(deck, JSON.stringify({ ...d, kind: 'refs', layer: 'project' }));
  const b = await startBoard(deck, { root: tmp() });
  try {
    const r = await fetch(new URL('/rate', b.url), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cardId: 'a', love: true, note: 'calm' }) });
    const j = await r.json();
    assert.equal(j.warning, undefined, j.warning);
    assert.match(readFileSync(join(proj, '.design/refs.jsonl'), 'utf8'), /calm/);
  } finally { await b.close(); }
});

// I5
test('I5: project init also ignores .apollo/', () => {
  const p = tmp();
  initProject({ projectDir: p, brands: [], commit: false });
  initProject({ projectDir: p, brands: [], commit: false });
  const lines = readFileSync(join(p, '.gitignore'), 'utf8').split('\n').map((l) => l.trim());
  assert.equal(lines.filter((l) => l === '.apollo/').length, 1);
  assert.equal(lines.filter((l) => l === '.design/').length, 1);
});

// I6
test('I6: Tailwind and CSS-in-JS slop is caught, and .ts/.js files are scanned', () => {
  const d = tmp();
  writeFileSync(join(d, 'Hero.tsx'), 'export const H = () => (\n  <h1 className="bg-gradient-to-r from-a to-b bg-clip-text text-transparent">Hi</h1>\n);\nexport const P = () => <main className="bg-[#f5f0e6]"><p className="uppercase tracking-widest text-xs">New</p><span className="animate-pulse" /></main>;\n');
  writeFileSync(join(d, 'styles.ts'), 'export const T = styled.h1`\n  -webkit-background-clip: text;\n`;\n');
  const rules = new Set(lintFiles([d], { dials: BASE_DIALS }).map((f) => `${f.rule}:${f.file.split('/').pop()}`));
  for (const r of ['gradient-text:Hero.tsx', 'beige-ground:Hero.tsx', 'eyebrow-label:Hero.tsx', 'pulse-glow:Hero.tsx', 'gradient-text:styles.ts']) assert.ok(rules.has(r), `${r} in ${[...rules]}`);
});

// M7
test('M7: the director passes the plugin root in every brief', () => {
  const s = readFileSync(join(here, '../skills/director/SKILL.md'), 'utf8');
  const brief = s.slice(s.indexOf('Every brief contains'), s.indexOf('Isolation rules'));
  assert.match(brief, /plugin root/i);
});

// M11
test('M11: arms with the same folder name are rejected', () => {
  const a = tmp(); const b = tmp();
  for (const root of [a, b]) mkdirSync(join(root, 'out', 'case1'), { recursive: true });
  assert.throws(() => buildBlindDeck(join(a, 'out'), join(b, 'out'), { out: tmp() }), /same name/);
});
