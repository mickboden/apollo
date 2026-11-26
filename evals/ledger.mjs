#!/usr/bin/env node
// Results ledger for both eval tracks (evals/ledger/<track>.jsonl).
//
//   node evals/ledger.mjs trend [--track regression|creative] [--file <ledger.jsonl>]
//   node evals/ledger.mjs add <runRoot>/sheets-result.json [--track ...] [--label v0.2.0] [--file ...]
//
// `node evals/sheets.mjs --score <runRoot>` appends automatically; `add` is for re-adding or moving a result.
// The regression track shows a per-case row across rounds, since its prompts never change.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from '../scripts/lib/args.mjs';
import { appendLedger, ledgerPath, readLedger, trendLines } from './lib/ledger.mjs';

const { flags, positionals } = parseArgs(process.argv.slice(2), { string: ['track', 'file', 'label'], boolean: ['json'] });
const [cmd, arg] = positionals;
if (cmd === 'trend') {
  const track = flags.track || 'regression';
  const entries = readLedger(resolve(flags.file || ledgerPath(track)));
  if (flags.json) console.log(JSON.stringify(entries, null, 2));
  else console.log([`${track} track: ${entries.length} round(s)`, ...trendLines(entries, { perCase: track === 'regression' })].join('\n'));
} else if (cmd === 'add' && arg) {
  const entry = JSON.parse(readFileSync(resolve(arg), 'utf8'));
  if (flags.label) entry.label = flags.label;
  if (flags.track) entry.track = flags.track;
  const file = resolve(flags.file || ledgerPath(entry.track || 'regression'));
  const n = appendLedger(file, entry);
  console.log(`recorded in ${file} (${n} round(s))`);
} else {
  console.error('Usage: node evals/ledger.mjs trend [--track regression|creative] [--file f] | add <sheets-result.json> [--track t] [--label l] [--file f]');
  process.exit(2);
}
