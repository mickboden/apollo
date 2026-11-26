// What the eval tools need to know about a case: is it recorded over time, is it a written report,
// and a one-line summary. Fixed regression cases are described here; creative cases carry a case.json.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Fixed motion cases: which file, which trigger, how long.
export const FIXED_MOTION = {
  'fix-stutter': { file: 'site/index.html', trigger: { type: 'click', selector: '#open' }, durationMs: 1600 },
  'opening-animation': { file: 'out/index.html', trigger: { type: 'load' }, durationMs: 4500 },
};
export const FIXED_REPORTS = new Set(['review-page']);

// Case folders in a directory: every subfolder with a prompt.md.
export const caseDirs = (dir) => (existsSync(dir) ? readdirSync(dir).filter((c) => statSync(join(dir, c)).isDirectory() && existsSync(join(dir, c, 'prompt.md'))).sort() : []);

const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);

// The prompt's first line, without front matter, as a fallback summary.
function firstLine(promptPath) {
  if (!existsSync(promptPath)) return '';
  const body = readFileSync(promptPath, 'utf8').replace(/^---[\s\S]*?---\n/, '').trim();
  return body.split('\n')[0].replace(/^lean:\s*/, '').slice(0, 200);
}

// caseDir: the case's folder (with prompt.md and maybe case.json), if known.
export function caseInfo(name, caseDir) {
  const meta = caseDir ? readJson(join(caseDir, 'case.json')) : null;
  return {
    name,
    track: meta?.track || 'regression',
    motion: meta ? meta.motion || null : FIXED_MOTION[name] || null,
    report: meta ? !!meta.report : FIXED_REPORTS.has(name),
    summary: meta?.summary || (caseDir ? firstLine(join(caseDir, 'prompt.md')) : '') || name,
  };
}

// A run root records its cases in <runRoot>/cases/<case>/ (copied there by run-blind).
export const runCaseInfo = (runRoot, name) => caseInfo(name, existsSync(join(runRoot, 'cases', name)) ? join(runRoot, 'cases', name) : null);
export const readRun = (runRoot) => readJson(join(runRoot, 'run.json'));
