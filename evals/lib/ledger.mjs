// Results ledger: one JSON line per scored round, per track, so rounds can be compared over time.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LEDGER_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'ledger');
export const ledgerPath = (track) => join(LEDGER_DIR, `${track}.jsonl`);

export function readLedger(file) {
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
}

// Append an entry; an entry with the same run id replaces the earlier one (re-scoring a round).
export function appendLedger(file, entry) {
  const rest = readLedger(file).filter((e) => !entry.run || e.run !== entry.run);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, [...rest, entry].map((e) => JSON.stringify(e)).join('\n') + '\n');
  return rest.length + 1;
}

const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : '–');

// Text trend: one line per round, and for a fixed case set, one row per case across rounds.
export function trendLines(entries, { perCase = false } = {}) {
  if (!entries.length) return ['No rounds recorded yet.'];
  const lines = ['date        label                apollo     won  tie  lost  both-weak  shippable'];
  for (const e of entries) {
    const t = e.totals; const other = e.arms.find((a) => a !== e.focus);
    lines.push(`${(e.date || '').slice(0, 10).padEnd(12)}${String(e.label || '').slice(0, 20).padEnd(21)}${String(e.apollo?.commit || '?').padEnd(11)}${String(t.wins[e.focus]).padStart(3)}  ${String(t.ties).padStart(3)}  ${String(t.wins[other]).padStart(4)}  ${String(t.bothWeak).padStart(9)}  ${String(t.focusShippable).padStart(3)}/${t.scored} (${pct(t.focusShippable, t.scored)})`);
  }
  if (perCase) {
    const names = [...new Set(entries.flatMap((e) => e.cases.map((c) => c.case)))].sort();
    lines.push('', 'per case, oldest round first (W won, T tie, L lost, · not scored; + shippable, ! both weak):');
    for (const n of names) {
      const marks = entries.map((e) => {
        const c = e.cases.find((x) => x.case === n);
        if (!c) return ' · ';
        const r = c.winner === 'tie' ? 'T' : c.winner === e.focus ? 'W' : 'L';
        const ok = c.ship === true && (c.winner === e.focus || c.winner === 'tie') ? '+' : ' ';
        return `${r}${ok}${c.bothWeak ? '!' : ' '}`;
      });
      lines.push(`${n.padEnd(24)} ${marks.join(' ')}`);
    }
  }
  return lines;
}
