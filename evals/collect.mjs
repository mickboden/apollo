#!/usr/bin/env node
// Turn each arm's workspace output into arms/<arm>/<case>/index.html, ready for eval-deck.
//
//   node evals/collect.mjs <runRoot>
//
// Works for both tracks: case details come from <runRoot>/cases/<case>/case.json (creative cases, copied in by
// run-blind) or from the fixed-case table in lib/cases.mjs.
// - Design cases: the built page (out/ or site/); slide sets are stacked into one page.
// - review-page: the final report, as a readable page.
// - Motion cases (fix-stutter, opening-animation, creative animation and Fix-stutter cases): a real-speed flipbook recorded with measureMotion, so the
//   difference is visible on the board, plus a link to the live page.
// - Nothing produced: an honest "No output" page.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { measureMotion } from '../scripts/lib/motion.mjs';
import { runCaseInfo } from './lib/cases.mjs';

const ROOT = process.argv[2] && resolve(process.argv[2]);
if (!ROOT) { console.error('Usage: node evals/collect.mjs <runRoot>'); process.exit(2); }


const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const page = (title, inner) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>body{margin:0;background:#F4F4F5;color:#1A1C21;font:16px/1.6 system-ui,sans-serif}main{max-width:860px;margin:0 auto;padding:48px 32px}h1,h2,h3{letter-spacing:-.01em}iframe{width:100%;aspect-ratio:16/9;border:0;border-radius:8px;background:#fff;margin:0 0 16px}</style></head><body><main>${inner}</main></body></html>`;
const md = (t) => esc(t).split('\n').map((l) => (/^### /.test(l) ? `<h3>${l.slice(4)}</h3>` : /^## /.test(l) ? `<h2>${l.slice(3)}</h2>` : /^# /.test(l) ? `<h1>${l.slice(2)}</h1>` : /^\s*[-*] /.test(l) ? `<li>${l.replace(/^\s*[-*] /, '')}</li>` : /^\s*\d+\. /.test(l) ? `<li>${l.replace(/^\s*\d+\. /, '')}</li>` : l.trim() ? `<p>${l}</p>` : '')).join('\n').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
const htmlFiles = (d) => readdirSync(d, { recursive: true }).filter((f) => f.endsWith('.html')).sort();

for (const arm of ['new', 'old']) {
  const armDir = join(ROOT, 'ws', arm);
  if (!existsSync(armDir)) continue;
  for (const c of readdirSync(armDir)) {
    const ws = join(armDir, c);
    const dest = join(ROOT, 'arms', arm, c);
    rmSync(dest, { recursive: true, force: true });
    mkdirSync(dest, { recursive: true });
    const final = existsSync(join(ws, 'FINAL_MESSAGE.md')) ? readFileSync(join(ws, 'FINAL_MESSAGE.md'), 'utf8') : '';

    const info = runCaseInfo(ROOT, c);
    if (info.report) { writeFileSync(join(dest, 'index.html'), page('Review', md(final || 'No report was produced.'))); continue; }

    if (info.motion && existsSync(join(ws, info.motion.file))) {
      const m = info.motion;
      const live = m.file.split('/')[0];
      cpSync(join(ws, live), join(dest, live), { recursive: true });
      try {
        const r = await measureMotion(join(dest, m.file), { trigger: m.trigger, durationMs: m.durationMs, dial: 'showcase', outDir: dest });
        renameSync(r.flipbook, join(dest, 'index.html'));
        const html = readFileSync(join(dest, 'index.html'), 'utf8').replace('</main>', `<p style="margin-top:12px"><a href="${m.file}" target="_blank" rel="noopener">Open the live page</a></p></main>`);
        writeFileSync(join(dest, 'index.html'), html);
      } catch (e) {
        writeFileSync(join(dest, 'index.html'), page('Recording failed', `<h1>Recording failed</h1><p>${esc(e.message)}</p><p><a href="${m.file}">Open the live page</a></p>`));
      }
      continue;
    }

    // Creative cases always write ./out; their ./site is the untouched starting page, never a result.
    const src = (info.track === 'creative' ? ['out'] : ['out', 'site']).map((d) => join(ws, d)).find((d) => existsSync(d) && htmlFiles(d).length);
    if (!src) { writeFileSync(join(dest, 'index.html'), page('No output', '<h1>No output was produced.</h1>')); continue; }
    cpSync(src, dest, { recursive: true });
    if (!existsSync(join(dest, 'index.html'))) {
      writeFileSync(join(dest, 'index.html'), page('Slides', htmlFiles(dest).map((f) => `<iframe src="${f}" loading="lazy" sandbox="allow-scripts"></iframe>`).join('\n')));
    }
  }
}
console.log(`collected into ${join(ROOT, 'arms')}`);
