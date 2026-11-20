// Stacking profile layers: base → personal → brands (project order) → project. Last layer wins per dial.
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './frontmatter.mjs';

const PLUGIN_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

export const DIAL_OPTIONS = {
  creativity: [1, 2, 3, 4, 5],
  colour: ['brand-exact', 'neutral-accent', 'two-tone', 'expressive', 'dark-stage'],
  motion: ['still', 'calm', 'expressive', 'showcase'],
  density: ['sparse', 'balanced', 'dense'],
  type: ['system', 'brand', 'editorial'],
  imagery: ['ui-only', 'real-photos', 'stylised', '3d'],
  output: ['mockup', 'prototype', 'production'],
};

export const BASE_DIALS = Object.freeze({
  creativity: 3, colour: 'neutral-accent', motion: 'calm', density: 'balanced', type: 'brand', imagery: 'real-photos', output: 'prototype',
});

export function profilesRoot(env = process.env) {
  if (env.APOLLO_PROFILES_DIR) return env.APOLLO_PROFILES_DIR;
  return join(env.HOME || homedir(), '.design-profiles');
}

const readLessons = (dir) => {
  const p = join(dir, 'lessons.md');
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8').split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2).trim());
};

const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []).map(String);

export function loadContext({ projectDir, root = profilesRoot() } = {}) {
  const notices = [];
  const dials = { ...BASE_DIALS };
  const never = new Set();
  let topReference = null;
  const layers = [{ kind: 'base', name: 'base taste', path: join(PLUGIN_ROOT, 'skills/director/references/base-taste.md'), body: 'Base taste: see skills/director/references/base-taste.md.', lessons: [] }];

  const apply = (kind, name, file, dir) => {
    const { data, body, error } = parseFrontmatter(readFileSync(file, 'utf8'));
    if (error) notices.push(`${kind} "${name}": front-matter could not be read (${error}); its dials and never-list were ignored`);
    for (const [k, v] of Object.entries(data.dials && typeof data.dials === 'object' ? data.dials : {})) {
      if (!Object.hasOwn(DIAL_OPTIONS, k)) { notices.push(`${kind} "${name}": unknown dial ${k}`); continue; }
      if (!DIAL_OPTIONS[k].includes(v)) { notices.push(`${kind} "${name}": invalid dial value ${k}: ${v}`); continue; }
      dials[k] = v;
    }
    asList(data.never).forEach((n) => never.add(n));
    if (typeof data.topReference === 'string' && data.topReference.trim()) topReference = data.topReference.trim();
    layers.push({ kind, name, path: file, body: body.trim(), lessons: readLessons(dir) });
    return data;
  };

  const personal = join(root, 'personal/profile.md');
  if (existsSync(personal)) apply('personal', 'personal', personal, dirname(personal));
  else notices.push(`no personal profile at ${personal}; using base taste only (create one with: profile init personal)`);

  let project = null;
  const projectFile = projectDir ? join(projectDir, '.design/project.md') : null;
  if (projectFile && existsSync(projectFile)) {
    project = parseFrontmatter(readFileSync(projectFile, 'utf8'));
    for (const b of asList(project.data.brands)) {
      const f = join(root, 'brands', b, 'profile.md');
      if (existsSync(f)) apply('brand', b, f, dirname(f));
      else notices.push(`brand "${b}" not found at ${f}`);
    }
    apply('project', projectDir.split('/').filter(Boolean).pop(), projectFile, dirname(projectFile));
  }
  return { dials, layers, never: [...never], topReference, notices };
}

export function renderContextMarkdown(ctx) {
  const out = ['# Design context', '', 'Layers stack base → personal → brand → project; later layers override earlier ones.', '', '## Dials', ''];
  for (const [k, v] of Object.entries(ctx.dials)) out.push(`- ${k}: ${v}`);
  out.push('', '## Top reference', '', ctx.topReference || '(none set)', '', '## Never-list', '', ctx.never.length ? ctx.never.map((n) => `- ${n}`).join('\n') : '(empty)', '', '## Layers', '');
  for (const l of ctx.layers) {
    out.push(`## ${l.kind}: ${l.name}`, '', l.body || '(empty)', '');
    if (l.lessons.length) out.push('Lessons:', ...l.lessons.slice(-20).map((x) => `- ${x}`), '');
  }
  if (ctx.notices.length) out.push('## Notices', '', ...ctx.notices.map((n) => `- ${n}`), '');
  return out.join('\n');
}
