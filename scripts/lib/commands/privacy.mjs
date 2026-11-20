import { existsSync } from 'node:fs';
import { scanPrivacy, defaultDenylistPath, defaultAllowlistPath } from '../privacy.mjs';
import { parseArgs } from '../args.mjs';

export async function run(argv) {
  const { flags, positionals } = parseArgs(argv, { string: ['denylist'], boolean: ['json'] });
  const dir = positionals[0] || '.';
  if (!existsSync(dir)) { console.error(`Not found: ${dir}`); return 2; }
  const denylistPath = flags.denylist || defaultDenylistPath();
  if (!existsSync(denylistPath)) console.error(`privacy: no denylist at ${denylistPath}; only emails, home paths and keys are checked`);
  const findings = scanPrivacy(dir, { denylistPath, allowlistPath: defaultAllowlistPath() });
  if (flags.json) console.log(JSON.stringify(findings, null, 2));
  else console.log(findings.length ? findings.map((f) => `FAIL ${f.rule} ${f.file}:${f.line}  ${f.excerpt}`).join('\n') : 'privacy: clean');
  return findings.length ? 1 : 0;
}
