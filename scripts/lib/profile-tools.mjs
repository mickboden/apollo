// Create profile and project layers, save lessons and references.
import { existsSync, mkdirSync, writeFileSync, appendFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { serializeFrontmatter } from './frontmatter.mjs';
import { profilesRoot } from './profiles.mjs';

export class UserError extends Error {}

const SECTIONS = {
  personal: ['## References', 'Links, frames and screenshots you rate. The board appends to refs.jsonl.', '## Main decisions', 'Choices that sit on top of every project: density, motion level per surface, voice, imagery stance.', '## Never', 'Things you never want, beyond base taste. Use slop-rule ids in front-matter `never:`; add free text here.'],
  brand: ['## References', 'Brand references: site, campaigns, product screens.', '## Main decisions', 'Brand rules every project under this brand follows.', '## Never', 'Brand-specific bans.', '## Brand values', 'Tokens (colours, type, radii, spacing), logo files, real assets.'],
};

const today = () => new Date().toISOString().slice(0, 10);

export function layerDir({ layer, root = profilesRoot(), projectDir }) {
  if (layer === 'personal') return join(root, 'personal');
  if (layer === 'project') { if (!projectDir) throw new UserError('project layer needs a project folder'); return join(projectDir, '.design'); }
  if (layer.startsWith('brand:')) return join(root, 'brands', layer.slice(6));
  throw new UserError(`unknown layer "${layer}" (use project | personal | brand:<name> | suggest-base)`);
}

function requireLayer(dir, layer) {
  if (existsSync(dir)) return;
  if (layer.startsWith('brand:')) throw new UserError(`brand "${layer.slice(6)}" not found at ${dir}`);
  throw new UserError(`${layer} layer not found at ${dir}`);
}

export function initProfile({ root = profilesRoot(), kind, name }) {
  if (kind !== 'personal' && kind !== 'brand') throw new UserError('kind must be personal or brand');
  if (kind === 'brand' && !/^[a-z0-9][a-z0-9-]*$/.test(name || '')) throw new UserError('brand name must be lowercase letters, digits and dashes');
  const dir = kind === 'personal' ? join(root, 'personal') : join(root, 'brands', name);
  const file = join(dir, 'profile.md');
  if (existsSync(file)) throw new UserError(`profile already exists: ${file}`);
  mkdirSync(dir, { recursive: true });
  const body = SECTIONS[kind].reduce((acc, line, i) => acc + line + (i % 2 ? '\n\n' : '\n\n'), '');
  writeFileSync(file, serializeFrontmatter({ kind, name: name || 'personal', topReference: '', dials: {}, never: [] }, body));
  for (const f of ['refs.jsonl', 'ratings.jsonl']) if (!existsSync(join(dir, f))) writeFileSync(join(dir, f), '');
  if (!existsSync(join(dir, 'lessons.md'))) writeFileSync(join(dir, 'lessons.md'), '# Lessons\n\n');
  return file;
}

export function initProject({ projectDir, brands = [], commit = false }) {
  const dir = join(projectDir, '.design');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'project.md');
  if (!existsSync(file)) writeFileSync(file, serializeFrontmatter({ brands, dials: {}, topReference: '' }, '## Project\n\nWhat this project is, who uses it, what success looks like.\n'));
  if (!existsSync(join(dir, 'contract.md'))) writeFileSync(join(dir, 'contract.md'), '# Contract\n\nEverything agreed, checked at hand-over. See references/contract.md.\n');
  if (!existsSync(join(dir, 'lessons.md'))) writeFileSync(join(dir, 'lessons.md'), '# Lessons\n\n');
  if (!commit) {
    const gi = join(projectDir, '.gitignore');
    const current = existsSync(gi) ? readFileSync(gi, 'utf8') : '';
    const have = (name) => current.split('\n').some((l) => [name, `${name}/`, `/${name}`, `/${name}/`, `${name}/*`, `**/${name}`, `**/${name}/`].includes(l.trim()));
    const add = ['.design', '.apollo'].filter((n) => !have(n)).map((n) => `${n}/\n`).join('');
    if (add) writeFileSync(gi, `${current}${current && !current.endsWith('\n') ? '\n' : ''}${add}`);
  }
  return file;
}

export function learn({ layer, rule, evidence, projectDir, root = profilesRoot() }) {
  if (!rule || !rule.trim()) throw new UserError('--rule is required');
  const line = `- ${today()} · ${rule.trim()}${evidence ? ` — ${evidence.trim()}` : ''}\n`;
  if (layer === 'suggest-base') {
    mkdirSync(root, { recursive: true });
    const f = join(root, 'suggested-base.md');
    if (!existsSync(f)) writeFileSync(f, '# Suggested base-taste changes\n\nLocal only. Review before editing the package base taste.\n\n');
    appendFileSync(f, line);
    return f;
  }
  const dir = layerDir({ layer, root, projectDir });
  requireLayer(dir, layer);
  const f = join(dir, 'lessons.md');
  if (!existsSync(f)) writeFileSync(f, '# Lessons\n\n');
  appendFileSync(f, line);
  return f;
}

export function appendRef({ layer, ref, projectDir, root = profilesRoot() }) {
  const dir = layerDir({ layer, root, projectDir });
  requireLayer(dir, layer);
  const f = join(dir, 'refs.jsonl');
  appendFileSync(f, `${JSON.stringify({ ...ref, at: ref.at || new Date().toISOString() })}\n`);
  return f;
}
