// Privacy scan: block emails, home paths, API keys and private words before anything is published.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname, sep } from 'node:path';
import { profilesRoot } from './profiles.mjs';

export const DEFAULT_IGNORE = ['.git', 'node_modules', '.apollo', '.superpowers', '.design', 'evals/results', 'docs/superpowers', '.langdock'];
const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.pdf', '.woff', '.woff2', '.ttf', '.otf', '.mp4', '.mov', '.zip', '.potx', '.pptx']);

const RULES = [
  { rule: 'email', re: /[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[A-Za-z]{2,}\b/ },
  { rule: 'home-path', re: /(?:\/Users\/|\/home\/)[^/\s'"`]+\/|C:\\Users\\[^\\\s]+\\/ },
  { rule: 'api-key', re: /\bsk-[A-Za-z0-9_-]{20,}|\bghp_[A-Za-z0-9]{30,}|\bAKIA[0-9A-Z]{16}\b|\bxox[bp]-/ },
  { rule: 'private-url', re: /figma\.com\/(?:design|file|board|proto|slides|make|deck)\/|[\w-]+\.(?:vercel\.app|netlify\.app|ngrok(?:-free)?\.app|ngrok\.io)\b/i },
];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function readDenylist(path) {
  if (!path || !existsSync(path)) return null;
  return readFileSync(path, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

function walk(dir, root, ignore, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const rel = relative(root, p).split(sep).join('/');
    if (ignore.some((i) => rel === i || rel.startsWith(`${i}/`))) continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, root, ignore, out);
    else if (!BINARY_EXT.has(extname(p).toLowerCase()) && st.size < 2_000_000) out.push(p);
  }
  return out;
}

// Denylist words match as case-insensitive substrings (they catch `--brand-ink`, `brandBlue`, `brand-assets/`).
// Words on the allowlist are blanked out first, for known-safe words that contain a denied one.
export function scanPrivacy(dir, { denylistPath, allowlistPath, ignore = DEFAULT_IGNORE } = {}) {
  const words = readDenylist(denylistPath) || [];
  const allow = readDenylist(allowlistPath) || [];
  const denyRe = words.length ? new RegExp(`(${words.map(escape).join('|')})`, 'i') : null;
  const allowRe = allow.length ? new RegExp(`(${allow.map(escape).join('|')})`, 'gi') : null;
  const denied = (s) => !!denyRe && denyRe.test(allowRe ? s.replace(allowRe, ' ') : s);
  const findings = [];
  for (const file of walk(dir, dir, ignore)) {
    const rel = relative(dir, file);
    if (denied(rel)) findings.push({ rule: 'denylist', file: rel, line: 0, excerpt: `(file path) ${rel}` });
    const text = readFileSync(file, 'utf8');
    if (text.includes('\u0000')) continue;
    text.split('\n').forEach((line, i) => {
      for (const { rule, re } of RULES) if (re.test(line)) findings.push({ rule, file: rel, line: i + 1, excerpt: line.trim().slice(0, 160) });
      if (denied(line)) findings.push({ rule: 'denylist', file: rel, line: i + 1, excerpt: line.trim().slice(0, 160) });
    });
  }
  return findings;
}

export const defaultDenylistPath = () => join(profilesRoot(), 'private-denylist.txt');
export const defaultAllowlistPath = () => join(profilesRoot(), 'private-allowlist.txt');
