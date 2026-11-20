import { migrate } from '../migrate.mjs';
import { parseArgs } from '../args.mjs';

export async function run(argv) {
  const { flags } = parseArgs(argv, { boolean: ['dry-run', 'undo', 'json'] });
  const r = migrate({ undo: !!flags.undo, dryRun: !!flags['dry-run'] });
  if (flags.json) { console.log(JSON.stringify(r, null, 2)); return 0; }
  const verb = flags['dry-run'] ? 'would move' : 'moved';
  for (const m of r.moved) console.log(`${verb} ${m.name}: ${m.from} → ${m.to}`);
  for (const s of r.skipped) console.log(`skipped ${s.name}: ${s.reason}`);
  if (!r.moved.length && !r.skipped.length) console.log(flags.undo ? 'migrate: nothing to restore' : 'migrate: nothing to move');
  if (!flags.undo && !flags['dry-run'] && r.moved.length) console.log('Undo any time with: migrate --undo. Restart Claude Code for the change to take effect.');
  return 0;
}
