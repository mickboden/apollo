import { initProject } from '../profile-tools.mjs';
import { parseArgs } from '../args.mjs';

export async function run(argv) {
  const { flags, positionals } = parseArgs(argv, { string: ['brand', 'dir'], boolean: ['commit'] });
  if (positionals[0] !== 'init') { console.error('Usage: project init [--brand a,b] [--commit] [--dir <project>]'); return 2; }
  const brands = flags.brand ? flags.brand.split(',').map((s) => s.trim()).filter(Boolean) : [];
  console.log(`Project layer at ${initProject({ projectDir: flags.dir || process.cwd(), brands, commit: !!flags.commit })}`);
  return 0;
}
