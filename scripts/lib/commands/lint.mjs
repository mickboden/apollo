import { lintFiles } from '../slop/lint.mjs';
import { loadContext } from '../profiles.mjs';
import { parseArgs } from '../args.mjs';
import { existsSync } from 'node:fs';

export async function run(argv) {
  const { flags, positionals } = parseArgs(argv, { string: ['project'], boolean: ['json'] });
  if (!positionals.length) { console.error('Usage: lint <paths...> [--project dir] [--json]'); return 2; }
  const missing = positionals.filter((p) => !existsSync(p));
  if (missing.length) { console.error(`Not found: ${missing.join(', ')}`); return 2; }
  const ctx = loadContext({ projectDir: flags.project || process.cwd() });
  const findings = lintFiles(positionals, { dials: ctx.dials, never: ctx.never });
  if (flags.json) console.log(JSON.stringify(findings, null, 2));
  else if (!findings.length) console.log('lint: clean');
  else for (const f of findings) console.log(`${f.severity.toUpperCase()} ${f.rule} ${f.file}:${f.line}  ${f.excerpt}\n     ${f.why}`);
  return findings.some((f) => f.severity === 'fail') ? 1 : 0;
}
