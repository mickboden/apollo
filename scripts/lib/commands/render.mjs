import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { renderMatrix } from '../render.mjs';
import { TargetError, ChromeError } from '../cdp.mjs';
import { parseArgs } from '../args.mjs';

export async function run(argv) {
  const { flags, positionals } = parseArgs(argv, { string: ['out', 'widths', 'themes', 'zoom'], boolean: ['json'] });
  if (!positionals[0]) { console.error('Usage: render <url|file> [--out dir] [--widths 390,768,1440] [--themes light,dark] [--zoom 2] [--json]'); return 2; }
  const list = (s, num) => s.split(',').filter(Boolean).map((x) => (num ? Number(x) : x));
  try {
    const outDir = flags.out || join('.apollo/render', new Date().toISOString().replace(/[:.]/g, '-'));
    const r = await renderMatrix(positionals[0], {
      outDir,
      ...(flags.widths && { widths: list(flags.widths, true) }),
      ...(flags.themes && { themes: list(flags.themes) }),
      ...(flags.zoom !== undefined && { zoom: list(flags.zoom, true) }),
    });
    // Saved next to the screenshots so critics reuse this run instead of rendering again.
    writeFileSync(join(outDir, 'render.json'), JSON.stringify({ target: positionals[0], at: new Date().toISOString(), ...r }, null, 2));
    if (flags.json) console.log(JSON.stringify(r, null, 2));
    else {
      console.log(`render: ${r.shots.length} screenshots in ${r.shots[0] ? r.shots[0].path.replace(/\/[^/]+$/, '') : '-'}`);
      console.log(r.findings.length ? r.findings.map((f) => `FAIL ${f.rule} @${f.width}${f.zoom > 1 ? `×${f.zoom}` : ''} ${f.theme} ${f.selector}: ${f.detail}`).join('\n') : 'render: no layout findings');
    }
    return r.findings.length ? 1 : 0;
  } catch (e) {
    if (e instanceof TargetError || e instanceof ChromeError) { console.error(`render not run: ${e.message}`); return 2; }
    throw e;
  }
}
