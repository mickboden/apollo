#!/usr/bin/env node
// Blind round runner: run eval cases headless in two arms, outside the eval sandbox (so Chrome works).
//
//   node evals/run-blind.mjs <runRoot> [--cases a,b] [--cases-dir <dir>] [--concurrency 4] [--old-skills impeccable,design-taste-frontend]
//
// Without --cases-dir it runs the fixed regression cases in evals/. With --cases-dir it runs the cases in that folder
// (for example a batch from evals/creative/generate.mjs). Either way the cases are copied to <runRoot>/cases/ and
// <runRoot>/run.json records the track, the Apollo commit and the arms, for collect, sheets and the ledger.
// Arm "new": the installed Apollo plugin, as is.
// Arm "old": Apollo's Skill tool blocked; the session follows the named upstream skills read from disk.
// Each run gets its own workspace: <runRoot>/ws/<arm>/<case>/ (fixture sites copied in), a log in <runRoot>/logs/.
// Afterwards: node evals/collect.mjs <runRoot>, then eval-deck and the board (see evals/README.md).
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { locateSkill } from '../scripts/lib/migrate.mjs';
import { parseArgs } from '../scripts/lib/args.mjs';
import { caseDirs } from './lib/cases.mjs';

const EVALS = dirname(fileURLToPath(import.meta.url));
const { flags, positionals } = parseArgs(process.argv.slice(2), { string: ['cases', 'cases-dir', 'concurrency', 'old-skills', 'minutes'] });
const ROOT = positionals[0] && resolve(positionals[0]);
if (!ROOT) { console.error('Usage: node evals/run-blind.mjs <runRoot> [--cases a,b] [--cases-dir <dir>] [--concurrency 4] [--old-skills impeccable,design-taste-frontend] [--minutes 75]'); process.exit(2); }

const CASES = flags['cases-dir'] ? resolve(flags['cases-dir']) : EVALS;
const track = flags['cases-dir'] ? 'creative' : 'regression';
const all = caseDirs(CASES);
const cases = flags.cases ? flags.cases.split(',').map((s) => s.trim()) : all;
const unknown = cases.filter((c) => !all.includes(c));
if (unknown.length) { console.error(`No such case in ${CASES}: ${unknown.join(', ')}`); process.exit(2); }
const oldSkills = (flags['old-skills'] || 'impeccable,design-taste-frontend').split(',').map((name) => ({ name, path: locateSkill(name) }));
const missing = oldSkills.filter((s) => !s.path);
if (missing.length) { console.error(`Old-arm skills not installed: ${missing.map((s) => s.name).join(', ')}`); process.exit(2); }

const body = (c) => readFileSync(join(CASES, c, 'prompt.md'), 'utf8').replace(/^---[\s\S]*?---\n/, '').trim();
const OLD_PREFIX = `Work the way you would with these skills: ${oldSkills.map((s) => `read ${join(s.path, 'SKILL.md')}`).join(', ')}, now, and follow them (their reference files and scripts live next to them). Do not use any "apollo" skill, agent, script or reference.\n\n`;
// Record the run: cases (prompt, case.json, fixtures) and what was run, so the round can be scored and compared later.
for (const c of cases) cpSync(join(CASES, c), join(ROOT, 'cases', c), { recursive: true, filter: (src) => !/[\\/]graders([\\/]|$)/.test(src) });
const git = (...a) => spawnSync('git', a, { cwd: EVALS, encoding: 'utf8' }).stdout?.trim() || null;
const version = JSON.parse(readFileSync(join(EVALS, '..', '.claude-plugin', 'plugin.json'), 'utf8')).version;
writeFileSync(join(ROOT, 'run.json'), `${JSON.stringify({ track, casesDir: CASES, cases, apollo: { version, commit: git('rev-parse', '--short', 'HEAD'), dirty: !!git('status', '--porcelain') }, arms: { new: 'apollo', old: `baseline (${oldSkills.map((s) => s.name).join(', ')})` }, startedAt: new Date().toISOString() }, null, 2)}\n`);

const ALLOWED = 'Bash Edit Write Read Glob Grep Skill Agent WebFetch WebSearch TodoWrite NotebookEdit';

const runJob = ({ c, arm }) => new Promise((done) => {
  const ws = join(ROOT, 'ws', arm, c);
  mkdirSync(ws, { recursive: true });
  const fx = join(CASES, c, 'fixtures', 'site');
  if (existsSync(fx) && !existsSync(join(ws, 'site'))) cpSync(fx, join(ws, 'site'), { recursive: true });
  const prompt = (arm === 'old' ? OLD_PREFIX : '') + body(c);
  const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--max-turns', '120', '--permission-mode', 'acceptEdits', '--allowedTools', ALLOWED, ...(arm === 'old' ? ['--disallowedTools', 'Skill'] : [])];
  mkdirSync(join(ROOT, 'logs'), { recursive: true });
  const t0 = Date.now();
  const p = spawn('claude', args, { cwd: ws, stdio: ['ignore', 'pipe', 'pipe'] });
  const chunks = [];
  p.stdout.on('data', (d) => chunks.push(d));
  p.stderr.on('data', (d) => chunks.push(d));
  const timer = setTimeout(() => p.kill('SIGTERM'), Number(flags.minutes || 75) * 60 * 1000);
  p.on('close', (code) => {
    clearTimeout(timer);
    const out = Buffer.concat(chunks);
    writeFileSync(join(ROOT, 'logs', `${arm}-${c}.jsonl`), out);
    let cost = null; let last = '';
    for (const l of out.toString().split('\n')) { try { const j = JSON.parse(l); if (j.type === 'result') { cost = j.total_cost_usd; last = j.result || ''; } } catch { /* not JSON */ } }
    writeFileSync(join(ws, 'FINAL_MESSAGE.md'), last);
    console.log(`${new Date().toISOString()} ${arm} ${c} exit=${code} min=${((Date.now() - t0) / 60000).toFixed(1)} cost=${cost}`);
    done();
  });
});

const queue = cases.flatMap((c) => ['new', 'old'].map((arm) => ({ c, arm })));
await Promise.all(Array.from({ length: Number(flags.concurrency || 4) }, async () => { while (queue.length) await runJob(queue.shift()); }));
console.log('ALL DONE');
