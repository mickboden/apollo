// Run checkpoints: a small state file in the project so an interrupted run resumes in minutes
// instead of starting over. Source of truth is .design/progress.json; progress.md is a readable copy.
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, renameSync } from 'node:fs';
import { join } from 'node:path';

export const LANES = ['Tweak', 'Refine', 'New', 'Explore', 'Fix', 'Review', 'Replicate'];
export class ProgressError extends Error {}

const paths = (projectDir) => { const dir = join(projectDir, '.design'); return { dir, json: join(dir, 'progress.json'), md: join(dir, 'progress.md'), prev: join(dir, 'progress.prev.json') }; };
const minutes = (from, to) => Math.max(0, Math.round((new Date(to) - new Date(from)) / 60000));

export function readProgress(projectDir) {
  const { json } = paths(projectDir);
  if (!existsSync(json)) return null;
  try { return JSON.parse(readFileSync(json, 'utf8')); }
  catch (e) { throw new ProgressError(`${json} is not valid JSON (${e.message}); fix or remove it with \`progress clear\``); }
}

function save(projectDir, state) {
  const p = paths(projectDir);
  mkdirSync(p.dir, { recursive: true });
  const tmp = `${p.json}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`);
  renameSync(tmp, p.json); // atomic: a crash mid-write never leaves half a file
  writeFileSync(p.md, formatProgress(state));
  return state;
}

const need = (state) => { if (!state) throw new ProgressError('no run in progress: start one with `progress start --lane <lane> --request "<one line>"`'); return state; };

export function startProgress(projectDir, { lane, request, budget, now = new Date().toISOString() }) {
  const canon = LANES.find((l) => l.toLowerCase() === String(lane || '').toLowerCase());
  if (!canon) throw new ProgressError(`--lane must be one of ${LANES.join(', ')}`);
  if (!request) throw new ProgressError('--request "<one-line restatement>" is required');
  const p = paths(projectDir);
  if (existsSync(p.json)) renameSync(p.json, p.prev);
  return save(projectDir, { version: 1, status: 'running', lane: canon, request, budgetMin: budget ? Number(budget) : null, startedAt: now, updatedAt: now, phase: 'start', pick: null, loop: 0, gates: {}, findings: [], overrides: [], next: null, log: [{ at: now, phase: 'start', note: request }] });
}

export function addProgress(projectDir, { phase, pick, gates = [], findings = [], resolved = [], next, note, loop, now = new Date().toISOString() }) {
  const s = need(readProgress(projectDir));
  if (!phase) throw new ProgressError('--phase is required (for example brief, references, concepts, contract, build, gates, fix-loop, handover)');
  s.phase = phase;
  if (pick) s.pick = pick;
  if (loop !== undefined) s.loop = Number(loop);
  for (const g of gates) {
    const m = /^([a-z][\w-]*)=(.+)$/i.exec(g);
    if (!m) throw new ProgressError(`--gate expects name=result, for example render=passed or "motion=failed: 2 violations" (got ${g})`);
    s.gates[m[1]] = { result: m[2].trim(), at: now };
  }
  for (const r of resolved) s.findings = r === 'all' ? [] : s.findings.filter((f) => f !== r && !f.includes(r));
  for (const f of findings) if (!s.findings.includes(f)) s.findings.push(f);
  if (next !== undefined) s.next = next;
  s.updatedAt = now;
  s.log.push({ at: now, phase, elapsedMin: minutes(s.startedAt, now), ...(note && { note }), ...(pick && { pick }), ...(gates.length && { gates }), ...(next && { next }) });
  return save(projectDir, s);
}

// A written, specific exception to one gate finding. Recorded here and repeated in the hand-over.
export function addOverride(projectDir, { gate, finding, reason, now = new Date().toISOString() }) {
  const s = need(readProgress(projectDir));
  if (!gate || !finding || !reason) throw new ProgressError('override needs --gate <gate> --finding "<the exact finding>" --reason "<why it is not a real problem>"');
  if (reason.trim().split(/\s+/).length < 4) throw new ProgressError('--reason must say why in a sentence, not a word');
  s.overrides.push({ gate, finding, reason, at: now });
  s.findings = s.findings.filter((f) => f !== finding);
  s.updatedAt = now;
  s.log.push({ at: now, phase: s.phase, elapsedMin: minutes(s.startedAt, now), note: `override ${gate}: ${finding}` });
  return save(projectDir, s);
}

export function finishProgress(projectDir, { note, now = new Date().toISOString() } = {}) {
  const s = need(readProgress(projectDir));
  s.status = 'done'; s.phase = 'handed-over'; s.next = null; s.updatedAt = now;
  s.log.push({ at: now, phase: 'handed-over', elapsedMin: minutes(s.startedAt, now), ...(note && { note }) });
  return save(projectDir, s);
}

export function clearProgress(projectDir) {
  const p = paths(projectDir);
  let removed = false;
  for (const f of [p.json, p.md]) if (existsSync(f)) { rmSync(f); removed = true; }
  return removed;
}

export function formatProgress(s, now = new Date().toISOString()) {
  if (!s) return 'No run in progress.\n';
  const elapsed = minutes(s.startedAt, s.status === 'done' ? s.updatedAt : now);
  const L = [];
  L.push(`# Apollo run: ${s.status === 'done' ? 'finished' : 'in progress'}`, '');
  L.push(`- **Request:** ${s.request}`);
  L.push(`- **Lane:** ${s.lane}`);
  L.push(`- **Phase:** ${s.phase}${s.loop ? ` (fix loop ${s.loop})` : ''}`);
  L.push(`- **Elapsed:** ${elapsed} min${s.budgetMin ? ` of a ${s.budgetMin} min estimate${elapsed >= 2 * s.budgetMin ? ' (past twice the estimate: finish what is in hand)' : ''}` : ''}`);
  if (s.pick) L.push(`- **Pick:** ${s.pick}`);
  if (s.next) L.push(`- **Next:** ${s.next}`);
  const gates = Object.entries(s.gates);
  if (gates.length) { L.push('', '## Gates'); for (const [g, r] of gates) L.push(`- ${g}: ${r.result}`); }
  if (s.findings.length) { L.push('', '## Open findings'); for (const f of s.findings) L.push(`- ${f}`); }
  if (s.overrides.length) { L.push('', '## Overrides (state each in the hand-over)'); for (const o of s.overrides) L.push(`- ${o.gate}: "${o.finding}" overridden because ${o.reason}`); }
  L.push('', '## Log');
  for (const e of s.log) L.push(`- ${e.at.slice(11, 16)} +${e.elapsedMin ?? 0}m ${e.phase}${e.note ? `: ${e.note}` : ''}${e.gates ? ` [${e.gates.join(', ')}]` : ''}`);
  return `${L.join('\n')}\n`;
}
