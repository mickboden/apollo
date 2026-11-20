// A small YAML-subset front-matter parser: scalars, quoted strings, inline arrays,
// one level of nested maps and block lists. Never throws.

const scalar = (raw) => {
  const v = raw.trim();
  if (v === '') return '';
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null' || v === '~') return null;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (v.startsWith('[')) {
    if (!v.endsWith(']')) throw new Error(`unclosed array: ${v}`);
    const inner = v.slice(1, -1).trim();
    return inner === '' ? [] : inner.split(',').map((s) => scalar(s));
  }
  return v;
};

function parseBlock(lines) {
  const data = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }
    if (/^\s/.test(line)) throw new Error(`unexpected indent: ${line}`);
    const m = line.match(/^([A-Za-z_][\w-]*):(.*)$/);
    if (!m) throw new Error(`not a key: ${line}`);
    const [, key, rest] = m;
    i++;
    if (rest.trim() !== '') { data[key] = scalar(rest); continue; }
    const child = [];
    while (i < lines.length && (/^\s+\S/.test(lines[i]) || !lines[i].trim())) { if (lines[i].trim()) child.push(lines[i]); i++; }
    if (child.length === 0) { data[key] = ''; continue; }
    if (child.every((l) => /^\s+-\s?/.test(l))) { data[key] = child.map((l) => scalar(l.replace(/^\s+-\s?/, ''))); continue; }
    const map = {};
    for (const l of child) {
      const cm = l.match(/^\s+([A-Za-z_][\w-]*):(.*)$/);
      if (!cm) throw new Error(`not a key: ${l}`);
      map[cm[1]] = scalar(cm[2]);
    }
    data[key] = map;
  }
  return data;
}

export function parseFrontmatter(text) {
  const src = String(text ?? '').replace(/^﻿/, '');
  if (!src.startsWith('---')) return { data: {}, body: src };
  const lines = src.split(/\r?\n/);
  const end = lines.indexOf('---', 1);
  if (end === -1) return { data: {}, body: src, error: 'front-matter is not closed with ---' };
  const body = lines.slice(end + 1).join('\n').replace(/^\n+/, '');
  try {
    return { data: parseBlock(lines.slice(1, end)), body };
  } catch (e) {
    return { data: {}, body, error: e.message };
  }
}

const out = (v) => {
  if (typeof v === 'string') return v === '' || /[:#\[\]{},"']|^\s|\s$|^(true|false|null|-?\d+(\.\d+)?)$/.test(v) ? JSON.stringify(v) : v;
  return String(v);
};

export function serializeFrontmatter(data, body = '') {
  const lines = ['---'];
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v)) lines.push(`${k}: [${v.map(out).join(', ')}]`);
    else if (v && typeof v === 'object') {
      const entries = Object.entries(v);
      if (entries.length === 0) lines.push(`${k}:`);
      else { lines.push(`${k}:`); for (const [ck, cv] of entries) lines.push(`  ${ck}: ${out(cv)}`); }
    } else lines.push(`${k}: ${out(v)}`);
  }
  lines.push('---');
  return `${lines.join('\n')}\n${body ? `${body.replace(/\n*$/, '')}\n` : ''}`;
}
