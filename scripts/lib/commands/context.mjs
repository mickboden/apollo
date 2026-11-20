import { loadContext, renderContextMarkdown } from '../profiles.mjs';
import { parseArgs } from '../args.mjs';

export async function run(argv) {
  const { flags } = parseArgs(argv, { string: ['project'], boolean: ['json'] });
  const ctx = loadContext({ projectDir: flags.project || process.cwd() });
  console.log(flags.json ? JSON.stringify(ctx, null, 2) : renderContextMarkdown(ctx));
  return 0;
}
