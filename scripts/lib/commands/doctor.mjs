import { parseArgs } from '../args.mjs';
import { runChecks, formatChecks } from '../doctor.mjs';

export async function run(argv) {
  const { flags } = parseArgs(argv, { boolean: ['json', 'skip-chrome'] });
  const checks = await runChecks({ chrome: !flags['skip-chrome'] });
  console.log(flags.json ? JSON.stringify(checks, null, 2) : formatChecks(checks));
  return checks.some((c) => c.blocking) ? 1 : 0;
}
