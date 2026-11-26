import { parseArgs } from '../args.mjs';
import { startProgress, addProgress, addOverride, finishProgress, clearProgress, readProgress, formatProgress, ProgressError } from '../progress.mjs';

const USAGE = `Usage:
  progress start --lane <lane> --request "<one line>" [--budget <minutes>]
  progress add --phase <phase> [--pick "<pick>"] [--gate name=result]... [--finding "<text>"]... [--resolved "<text>"|all]... [--next "<step>"] [--loop <n>] [--note "<text>"]
  progress override --gate <gate> --finding "<exact finding>" --reason "<why it is not a real problem>"
  progress show [--json]      progress done [--note "<text>"]      progress clear
All take [--project <dir>] (default: current folder). State lives in <project>/.design/progress.json.`;

export async function run(argv) {
  const [sub, ...rest] = argv;
  let flags;
  try { ({ flags } = parseArgs(rest, { string: ['project', 'lane', 'request', 'budget', 'phase', 'pick', 'next', 'note', 'loop', 'gate', 'finding', 'reason'], boolean: ['json'], multi: sub === 'add' ? ['gate', 'finding', 'resolved'] : [] })); }
  catch (e) { console.error(`${e.message}\n\n${USAGE}`); return 2; }
  const dir = flags.project || process.cwd();
  try {
    if (sub === 'start') { startProgress(dir, flags); console.log(`progress: started ${flags.lane} run`); return 0; }
    if (sub === 'add') { const s = addProgress(dir, { ...flags, gates: flags.gate || [], findings: flags.finding || [], resolved: flags.resolved || [] }); console.log(`progress: ${s.phase} saved${s.next ? `; next: ${s.next}` : ''}`); return 0; }
    if (sub === 'override') { addOverride(dir, flags); console.log(`progress: override recorded for ${flags.gate}; state it in the hand-over`); return 0; }
    if (sub === 'done') { finishProgress(dir, flags); console.log('progress: run marked as handed over'); return 0; }
    if (sub === 'clear') { console.log(clearProgress(dir) ? 'progress: cleared' : 'progress: nothing to clear'); return 0; }
    if (sub === 'show') { const s = readProgress(dir); console.log(flags.json ? JSON.stringify(s, null, 2) : formatProgress(s).trimEnd()); return 0; }
    console.error(USAGE); return 2;
  } catch (e) {
    if (e instanceof ProgressError) { console.error(`progress: ${e.message}`); return 2; }
    throw e;
  }
}
