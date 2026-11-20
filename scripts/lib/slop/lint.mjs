// Static slop linter. Rules live in rules.json (shared with critic-slop).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RULES_PATH = join(dirname(fileURLToPath(import.meta.url)), 'rules.json');
const CSS_EXT = new Set(['.css', '.scss', '.sass', '.less']);
const SCRIPT_EXT = new Set(['.ts', '.js', '.mjs', '.cjs']);
const MARKUP_EXT = new Set(['.html', '.jsx', '.tsx', '.vue', '.svelte', '.astro']);
const ALL_EXT = new Set([...CSS_EXT, ...MARKUP_EXT, ...SCRIPT_EXT]);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.apollo', '.design']);

export const loadRules = () => JSON.parse(readFileSync(RULES_PATH, 'utf8'));

function walk(p, out = []) {
  const st = statSync(p);
  if (st.isDirectory()) {
    for (const e of readdirSync(p)) if (!SKIP_DIRS.has(e)) walk(join(p, e), out);
  } else if (ALL_EXT.has(extname(p).toLowerCase())) out.push(p);
  return out;
}

// --- colour helpers ---------------------------------------------------------
export function parseColour(s) {
  const t = s.trim().toLowerCase();
  let m = t.match(/^#([0-9a-f]{3,8})\b/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    return rgbToHsl(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16));
  }
  m = t.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
  if (m) return rgbToHsl(+m[1], +m[2], +m[3]);
  m = t.match(/^hsla?\(\s*(-?[\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/);
  if (m) return { h: ((+m[1] % 360) + 360) % 360, s: +m[2], l: +m[3] };
  if (t.startsWith('white')) return { h: 0, s: 0, l: 100 };
  if (t.startsWith('black')) return { h: 0, s: 0, l: 0 };
  return null;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b); const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s: s * 100, l: l * 100 };
}

const inRange = (v, [a, b]) => v >= a && v <= b;
const COLOUR_TOKEN = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(white|black)\b/gi;

// --- per-file context: strip comments, find keyframes blocks -----------------
function stripCssComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

function keyframeBlocks(lines) {
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/@(?:-webkit-)?keyframes\s+([\w-]+)/);
    if (!m) continue;
    let depth = 0; let started = false; let j = i;
    for (; j < lines.length; j++) {
      for (const ch of lines[j]) { if (ch === '{') { depth++; started = true; } else if (ch === '}') depth--; }
      if (started && depth <= 0) break;
    }
    blocks.push({ name: m[1], start: i, end: Math.min(j, lines.length - 1) });
    i = j;
  }
  return blocks;
}

const ruleActive = (rule, dials) => !rule.dials?.motion || rule.dials.motion.includes(dials?.motion ?? 'calm');

function scopeOk(scope, ext) {
  if (!scope || scope === 'any') return true;
  if (scope === 'css') return CSS_EXT.has(ext) || MARKUP_EXT.has(ext) || SCRIPT_EXT.has(ext); // style blocks, styled props and CSS-in-JS
  if (scope === 'markup') return MARKUP_EXT.has(ext);
  return true;
}

function matchRule(rule, { lines, ext, blocks }) {
  const m = rule.matcher;
  const hits = [];
  const each = (fn) => lines.forEach((line, i) => { if (fn(line)) hits.push(i); });
  switch (m.kind) {
    case 'regex': {
      if (!scopeOk(m.scope, ext)) break;
      const re = new RegExp(m.pattern, m.flags || '');
      each((l) => re.test(l));
      break;
    }
    case 'colour-hsl': {
      const re = new RegExp(`(?<![-\\w])(${m.props.join('|')})\\s*:\\s*([^;}]+)`, 'i');
      each((l) => {
        const mm = l.match(re);
        if (!mm) return false;
        return (mm[2].match(COLOUR_TOKEN) || []).some((tok) => { const c = parseColour(tok); return c && inRange(c.h, m.hue) && inRange(c.s, m.sat) && inRange(c.l, m.light); });
      });
      break;
    }
    case 'border-side':
      each((l) => {
        const mm = l.match(/border-(?:left|right|inline-start|inline-end)(?:-width)?\s*:\s*([^;}]+)/i);
        if (!mm) return false;
        const w = mm[1].match(/(\d+(?:\.\d+)?)px/);
        if (!w || +w[1] < m.minWidth) return false;
        const toks = mm[1].match(COLOUR_TOKEN);
        if (!toks) return true;
        return toks.some((t) => { const c = parseColour(t); return !c || c.s >= 10; });
      });
      break;
    case 'easing-overshoot':
      each((l) => [...l.matchAll(/cubic-bezier\(([^)]+)\)/gi)].some((mm) => {
        const n = mm[1].split(',').map(Number);
        return n.length === 4 && (n[1] < 0 || n[1] > 1 || n[3] < 0 || n[3] > 1);
      }));
      break;
    case 'shadow-offset':
      each((l) => {
        const mm = l.match(/box-shadow\s*:\s*(?:inset\s+)?(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+0(?:px)?\b/i);
        return !!mm && (+mm[1] !== 0 || +mm[2] !== 0);
      });
      break;
    case 'keyframes-name':
      for (const b of blocks) if (new RegExp(m.pattern, 'i').test(b.name)) hits.push(b.start);
      break;
    case 'keyframes-translate':
      for (const b of blocks) {
        for (let i = b.start; i <= b.end; i++) {
          const big = [...lines[i].matchAll(/translate(?:X|Y|3d)?\(\s*(-?\d+(?:\.\d+)?)px(?:\s*,\s*(-?\d+(?:\.\d+)?)px)?/gi)].some((mm) => Math.abs(+mm[1]) > m.maxPx || Math.abs(+(mm[2] || 0)) > m.maxPx);
          if (big) { hits.push(i); break; }
        }
      }
      break;
    case 'motion-prop': {
      const re = new RegExp(m.pattern, 'i');
      for (const b of blocks) for (let i = b.start; i <= b.end; i++) if (re.test(lines[i])) { hits.push(i); break; }
      const tre = new RegExp(m.transitionPattern, 'i');
      each((l) => { const mm = l.match(/transition(?:-property)?\s*:\s*([^;}]+)/i); return !!mm && tre.test(mm[1]); });
      break;
    }
    case 'words': {
      if (!scopeOk(m.scope, ext)) break;
      const re = new RegExp(`\\b(${m.words.map((w) => w.replace(/[-]/g, '\\-')).join('|')})\\b`, 'i');
      each((l) => {
        const text = l.replace(/<[^>]*>/g, ' ').replace(/\b(class|className|id|href|src|import|from)\s*=?\s*["'][^"']*["']/g, ' ');
        return re.test(text);
      });
      break;
    }
    case 'class-tokens': {
      // Utility-class stacks (Tailwind and similar): every token in `all` must appear in one class attribute.
      const res = m.all.map((t) => new RegExp(`(^|[\\s"'\`{])${t}(?=$|[\\s"'\`}])`));
      each((l) => [...l.matchAll(/class(?:Name)?\s*=\s*(?:\{?\s*[`"'])([^`"']*)/g)].some((mm) => res.every((re) => re.test(` ${mm[1]} `))));
      break;
    }
    case 'tailwind-colour':
      each((l) => [...l.matchAll(/\bbg-\[(#[0-9a-fA-F]{3,8})\]/g)].some((mm) => { const c = parseColour(mm[1]); return c && inRange(c.h, m.hue) && inRange(c.s, m.sat) && inRange(c.l, m.light); }));
      break;
    case 'emoji-in-element':
      if (!MARKUP_EXT.has(ext)) break;
      each((l) => /<(button|li|h[1-6])\b[^>]*>[^<]*\p{Extended_Pictographic}/u.test(l) || (ext !== '.html' && />[^<{]*\p{Extended_Pictographic}/u.test(l)));
      break;
    default:
      throw new Error(`unknown matcher kind ${m.kind} in rule ${rule.id}`);
  }
  return [...new Set(hits)].sort((a, b) => a - b);
}

export function lintFiles(paths, { dials = {}, never = [], extraRules = [] } = {}) {
  const rules = [...loadRules(), ...extraRules].filter((r) => r.matcher && r.detect !== 'critic');
  const matchersOf = (r) => [r.matcher, ...(r.alsoMatchers || [])];
  const findings = [];
  for (const file of paths.flatMap((p) => walk(p))) {
    const ext = extname(file).toLowerCase();
    const raw = readFileSync(file, 'utf8');
    const lines = (CSS_EXT.has(ext) ? stripCssComments(raw) : raw).split('\n');
    const blocks = keyframeBlocks(lines);
    for (const rule of rules) {
      if (!ruleActive(rule, dials)) continue;
      const hits = [...new Set(matchersOf(rule).flatMap((matcher) => matchRule({ ...rule, matcher }, { lines, ext, blocks })))].sort((a, b) => a - b);
      for (const i of hits) {
        findings.push({ rule: rule.id, severity: never.includes(rule.id) ? 'fail' : rule.severity, file, line: i + 1, excerpt: raw.split('\n')[i].trim().slice(0, 160), why: rule.why });
      }
    }
  }
  return findings;
}
