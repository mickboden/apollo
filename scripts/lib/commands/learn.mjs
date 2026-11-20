import { learn, UserError } from '../profile-tools.mjs';
import { parseArgs } from '../args.mjs';

export async function run(argv) {
  const { flags } = parseArgs(argv, { string: ['layer', 'rule', 'evidence', 'project'] });
  if (!flags.layer || !flags.rule) { console.error('Usage: learn --layer project|personal|brand:<name>|suggest-base --rule "<text>" [--evidence "<text>"]'); return 2; }
  try { console.log(`Saved to ${flags.layer}: ${flags.rule} (${learn({ ...flags, projectDir: flags.project || process.cwd() })})`); return 0; }
  catch (e) { if (e instanceof UserError) { console.error(e.message); return 1; } throw e; }
}
