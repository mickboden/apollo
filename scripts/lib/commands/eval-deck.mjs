import { buildBlindDeck, scoreBlindDeck } from '../eval-deck.mjs';
import { join } from 'node:path';
import { parseArgs } from '../args.mjs';
import { caseDirs, caseInfo } from '../../../evals/lib/cases.mjs';

export async function run(argv) {
  const { flags, positionals } = parseArgs(argv, { string: ['out', 'score', 'seed', 'cases-dir'], boolean: ['json'] });
  if (flags.score) {
    const s = scoreBlindDeck(flags.score);
    if (flags.json) console.log(JSON.stringify(s, null, 2));
    else {
      for (const c of s.cases) console.log(`${c.case.padEnd(22)} ${s.newArm} ${c[s.newArm]}  ${s.oldArm} ${c[s.oldArm]}  → ${c.winner}`);
      if (s.unrated.length) console.log(`unrated: ${s.unrated.join(', ')}`);
      console.log(`average ${s.newArm} ${s.averages[s.newArm]} · ${s.oldArm} ${s.averages[s.oldArm]} · ${s.newArm} preferred in ${s.preferred[s.newArm]}/${s.bar.of} (bar: avg ≥${s.bar.average}, preferred ≥${s.bar.preferredAtLeast})`);
      console.log(s.pass ? 'PASS' : 'FAIL');
    }
    return s.pass ? 0 : 1;
  }
  const [newDir, oldDir] = positionals;
  if (!newDir || !oldDir || !flags.out) { console.error('Usage: eval-deck <newArmDir> <oldArmDir> --out <dir> [--seed n] [--cases-dir <dir>] | eval-deck --score <dir>'); return 2; }
  // --cases-dir (a creative batch or <runRoot>/cases): put each case's one-line summary on its cards.
  const titles = flags['cases-dir'] ? Object.fromEntries(caseDirs(flags['cases-dir']).map((c) => [c, caseInfo(c, join(flags['cases-dir'], c)).summary])) : {};
  const deck = buildBlindDeck(newDir, oldDir, { out: flags.out, titles, ...(flags.seed && { seed: Number(flags.seed) }) });
  for (const n of deck.notices) console.error(n);
  console.log(`Blind deck with ${deck.cards.length} cards at ${flags.out}/deck.json. Serve it with: board serve ${flags.out}/deck.json`);
  return 0;
}
