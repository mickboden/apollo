// Move overlapping design skills out of the auto-loaded skills folder (reversibly), and find upstream skills.
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, renameSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, dirname, isAbsolute } from 'node:path';

export const OVERLAPPING = ['impeccable', 'design-taste-frontend', 'emil-design-eng', 'animate', 'apple-design', 'break-ui', 'review-animations', 'find-animation-opportunities', 'improve-animations', 'animation-performance', 'mobile-native', 'pick-ui-library', 'prototype'];

const paths = (home) => ({ skills: join(home, '.claude/skills'), specialists: join(home, '.claude/apollo-specialists'), manifest: join(home, '.claude/apollo-specialists/manifest.json') });
const present = (p) => { try { lstatSync(p); return true; } catch { return false; } };

function moveEntry(from, to) {
  const st = lstatSync(from);
  if (st.isSymbolicLink()) {
    const target = readlinkSync(from);
    const abs = isAbsolute(target) ? target : resolve(dirname(from), target);
    symlinkSync(abs, to);
    unlinkSync(from);
  } else renameSync(from, to);
}

const readManifest = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : { moved: [] });

export function migrate({ home = homedir(), undo = false, dryRun = false } = {}) {
  const P = paths(home);
  const moved = []; const skipped = [];
  const manifest = readManifest(P.manifest);
  if (!undo) {
    for (const name of OVERLAPPING) {
      const from = join(P.skills, name); const to = join(P.specialists, name);
      if (!present(from)) continue;
      if (present(to)) { skipped.push({ name, reason: `destination exists: ${to}` }); continue; }
      moved.push({ name, from, to });
      if (dryRun) continue;
      mkdirSync(P.specialists, { recursive: true });
      moveEntry(from, to);
      manifest.moved = manifest.moved.filter((m) => m.name !== name).concat({ name, from, to, at: new Date().toISOString() });
    }
  } else {
    const keep = [];
    for (const m of manifest.moved) {
      if (!present(m.to)) { skipped.push({ name: m.name, reason: `nothing at ${m.to}` }); continue; }
      if (present(m.from)) { skipped.push({ name: m.name, reason: `original path occupied again: ${m.from}` }); keep.push(m); continue; }
      moved.push({ name: m.name, from: m.to, to: m.from });
      if (dryRun) { keep.push(m); continue; }
      mkdirSync(dirname(m.from), { recursive: true });
      moveEntry(m.to, m.from);
    }
    manifest.moved = keep;
  }
  if (!dryRun && (moved.length || undo)) { mkdirSync(P.specialists, { recursive: true }); writeFileSync(P.manifest, `${JSON.stringify(manifest, null, 2)}\n`); }
  return { moved, skipped };
}

// `name` may carry a plugin namespace as Claude Code shows it (`superpowers:systematic-debugging`).
// Loose skill folders match on the bare name; inside the plugin cache the path must contain the plugin's folder.
export function locateSkill(name, { home = homedir() } = {}) {
  const P = paths(home);
  const [ns, bare] = name.includes(':') ? name.split(':', 2) : [null, name];
  if (!bare) return null;
  for (const dir of [P.specialists, join(home, '.agents/skills'), P.skills]) {
    const p = join(dir, bare);
    if (existsSync(join(p, 'SKILL.md'))) return p;
  }
  const cache = join(home, '.claude/plugins/cache');
  if (!existsSync(cache)) return null;
  const stack = [[cache, 0]];
  while (stack.length) {
    const [dir, depth] = stack.pop();
    if (depth > 6) continue;
    let entries; try { entries = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (!e.isDirectory() || e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = join(dir, e.name);
      if (e.name === bare && dir.endsWith('/skills') && (!ns || dir.split(/[\\/]/).includes(ns)) && existsSync(join(p, 'SKILL.md'))) return p;
      stack.push([p, depth + 1]);
    }
  }
  return null;
}
