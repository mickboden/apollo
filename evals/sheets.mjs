#!/usr/bin/env node
// Blind A/B sheets: one static PNG per case, both arms side by side, sides shuffled per case.
//
//   node evals/sheets.mjs <runRoot> [--seed n] [--cases a,b] [--reshuffle]
//   node evals/sheets.mjs --score <runRoot> [--label v0.2.0] [--track regression|creative] [--ledger <file> | --no-ledger] [--json]
//
// Reads <runRoot>/arms/<arm>/<case>/ (from evals/collect.mjs). Writes:
//   <runRoot>/sheets/<case>.png    desktop 1440 on top, phone 390 below, A left, B right
//   <runRoot>/sheets/scores.md     the scoring template (kept if it already exists)
//   <runRoot>/sheets-key.json      which arm is A and B per case; outside sheets/ so the folder can be shared blind
// Motion cases show four frames over time and then the settled end state. Chrome comes from CHROME_PATH or the usual places.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { parseArgs } from '../scripts/lib/args.mjs';
import { launch } from '../scripts/lib/cdp.mjs';
import { readRun, runCaseInfo } from './lib/cases.mjs';
import { appendLedger, ledgerPath } from './lib/ledger.mjs';
import { composeSheet, shootMotion, shootStatic } from './lib/shoot.mjs';
import { DESKTOP, PHONE, assignSides, listArms, listCases, parseScores, scoringTemplate, sheetHtml, tally, targetFor } from './lib/sheets.mjs';

const USAGE = 'Usage: node evals/sheets.mjs <runRoot> [--seed n] [--cases a,b] [--reshuffle] | --score <runRoot> [--label l] [--track t] [--ledger f | --no-ledger] [--json]';

async function build(root, flags) {
  const arms = listArms(root);
  let { cases, notices } = listCases(root, arms);
  if (flags.cases) { const want = flags.cases.split(',').map((s) => s.trim()); cases = cases.filter((c) => want.includes(c)); }
  for (const n of notices) console.error(n);
  if (!cases.length) throw new Error('no case has output in both arms');
  const keyPath = join(root, 'sheets-key.json');
  let key = existsSync(keyPath) && !flags.reshuffle ? JSON.parse(readFileSync(keyPath, 'utf8')) : null;
  if (key && cases.some((c) => !key.sides[c])) key = { ...key, sides: { ...assignSides(cases, arms, key.seed).sides, ...key.sides } };
  key ||= assignSides(cases, arms, flags.seed ? Number(flags.seed) : Date.now());
  writeFileSync(keyPath, `${JSON.stringify(key, null, 2)}\n`);

  const out = join(root, 'sheets');
  mkdirSync(join(out, 'shots'), { recursive: true });
  const infos = cases.map((c) => runCaseInfo(root, c));
  const browser = await launch();
  try {
    for (const info of infos) {
      const c = info.name; const dir = join(out, 'shots', c);
      mkdirSync(dir, { recursive: true });
      const sides = {};
      for (const side of ['A', 'B']) {
        const file = targetFor(root, key.sides[c][side], c, info);
        const s = {};
        for (const vp of [DESKTOP, PHONE]) {
          const prefix = join(dir, `${side}-${vp.name}`);
          const rel = (p) => relative(dir, p);
          if (!file) { s[vp.name] = { error: 'No output' }; continue; }
          try {
            if (info.motion) {
              const m = await shootMotion(browser, file, vp, info.motion, { prefix });
              s.frames = { ...s.frames, [vp.name]: m.frames.map((f) => ({ src: rel(f.path), at: f.at })) };
              s[vp.name] = { src: rel(m.end.path), height: m.end.height, fullHeight: m.end.fullHeight };
              if (m.note) console.error(`${c} ${side} ${vp.name}: ${m.note}`);
            } else {
              const r = await shootStatic(browser, file, vp, `${prefix}.png`);
              s[vp.name] = { src: rel(r.path), height: r.height, fullHeight: r.fullHeight };
            }
          } catch (e) { s[vp.name] = { error: `Capture failed: ${e.message}` }; }
        }
        sides[side] = s;
      }
      const html = join(dir, 'sheet.html');
      writeFileSync(html, sheetHtml({ id: c, summary: info.summary, motion: !!info.motion, ...sides }));
      const r = await composeSheet(browser, html, join(out, `${c}.png`), { width: 2 * DESKTOP.shownWidth + 112 });
      console.log(`${c}.png  ${r.width}×${r.height}${info.motion ? '  (motion: 4 frames + end state)' : ''}`);
    }
  } finally { await browser.close(); }
  const tpl = join(out, 'scores.md');
  if (!existsSync(tpl)) writeFileSync(tpl, scoringTemplate(infos, root));
  else console.error(`kept the existing ${tpl}`);
  console.log(`sheets in ${out}; fill in ${tpl}, then: node evals/sheets.mjs --score ${root}`);
}

function score(root, flags) {
  const key = JSON.parse(readFileSync(join(root, 'sheets-key.json'), 'utf8'));
  const scores = parseScores(readFileSync(join(root, 'sheets', 'scores.md'), 'utf8'));
  const run = readRun(root);
  const t = tally(scores, key);
  const track = flags.track || run?.track || 'regression';
  const entry = {
    run: `${basename(root)}@${run?.startedAt || 'unknown'}`, date: new Date().toISOString(), track,
    label: flags.label || run?.apollo?.version || '', apollo: run?.apollo || null, armLabels: run?.arms || null, ...t,
  };
  writeFileSync(join(root, 'sheets-result.json'), `${JSON.stringify(entry, null, 2)}\n`);
  if (flags.json) console.log(JSON.stringify(entry, null, 2));
  else {
    for (const c of t.cases) console.log(`${c.case.padEnd(28)} A=${c.A} B=${c.B}  pick ${c.pick.padEnd(3)} → ${c.winner.padEnd(5)} ship ${c.ship === null ? '?' : c.ship ? 'yes' : 'no'}${c.bothWeak ? '  both weak' : ''}`);
    if (t.unscored.length) console.log(`unscored: ${t.unscored.join(', ')}`);
    const other = t.arms.find((a) => a !== t.focus);
    console.log(`${t.focus} won ${t.totals.wins[t.focus]}, ${other} won ${t.totals.wins[other]}, ties ${t.totals.ties}; both weak ${t.totals.bothWeak}; ${t.focus} good enough to ship in ${t.totals.focusShippable}/${t.totals.scored}`);
  }
  if (!flags['no-ledger']) {
    const file = resolve(flags.ledger || ledgerPath(track));
    appendLedger(file, entry);
    console.log(`recorded in ${file}`);
  }
  return t.unscored.length ? 1 : 0;
}

const { flags, positionals } = parseArgs(process.argv.slice(2), { string: ['seed', 'cases', 'score', 'label', 'track', 'ledger'], boolean: ['reshuffle', 'no-ledger', 'json'] });
try {
  if (flags.score) process.exitCode = score(resolve(flags.score), flags);
  else if (positionals[0]) await build(resolve(positionals[0]), flags);
  else { console.error(USAGE); process.exitCode = 2; }
} catch (e) { console.error(e.message); process.exitCode = 1; }
