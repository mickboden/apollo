#!/usr/bin/env node
// Apollo CLI — deterministic checks and profile tools used by the Director and its agents.
// Exit codes: 0 clean · 1 findings (gate failed) · 2 could not run.
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { nodeProblem } from './lib/node-version.mjs';

export const COMMANDS = {
  doctor: 'Check Node, Chrome, profiles and plugin root, with a fix for each problem: doctor [--json] [--skip-chrome]',
  progress: 'Checkpoint a run so it can resume: progress start | add | override | show | done | clear',
  context: 'Print the merged design context (base → personal → brands → project)',
  profile: 'Create a profile: profile init personal | profile init brand <name>',
  project: 'Create the project layer: project init [--brand a,b] [--commit]',
  learn: 'Save a lesson to a layer: learn --layer <l> --rule "<text>" [--evidence "<text>"]',
  lint: 'Scan source files for slop patterns: lint <paths...> [--project dir] [--json]',
  render: 'Render widths × themes × zoom and find overflow/overlap: render <url|file>',
  motion: 'Measure frame timing and animated properties: motion <url|file> [--click sel]',
  privacy: 'Scan a folder for private data before publishing: privacy [dir]',
  board: 'Rating board: board serve <deck.json> | board results <deck.json>',
  migrate: 'Move overlapping design skills aside (reversible): migrate [--dry-run] [--undo]',
  locate: 'Find an upstream skill folder: locate <skill>',
  'eval-deck': 'Build or score a blind A/B deck: eval-deck <dirA> <dirB> --out <dir> [--cases-dir <dir>] | --score <dir>',
};

function usage() {
  const w = Math.max(...Object.keys(COMMANDS).map((k) => k.length));
  return ['Usage: cli.mjs <command> [args]', '', ...Object.entries(COMMANDS).map(([k, v]) => `  ${k.padEnd(w)}  ${v}`)].join('\n');
}

export async function main(argv, { version = process.version } = {}) {
  const tooOld = nodeProblem(version); // before any command loads: older Node fails later with confusing errors
  if (tooOld) { console.error(tooOld); return 2; }
  const [cmd, ...args] = argv;
  if (!cmd || cmd === '--help' || cmd === '-h') { console.log(usage()); return cmd ? 0 : 2; }
  if (!Object.hasOwn(COMMANDS, cmd)) { console.error(`Unknown command: ${cmd}\n\n${usage()}`); return 2; }
  const here = dirname(fileURLToPath(import.meta.url));
  const mod = await import(pathToFileURL(join(here, 'lib/commands', `${cmd}.mjs`)).href);
  return mod.run(args);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (err) => { console.error(err?.message || err); process.exitCode = 2; });
}
