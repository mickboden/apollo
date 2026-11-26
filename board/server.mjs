// Local rating board: serves a deck, records ♥ / ✕ / 1–5 / note per card, writes references back to a profile layer.
import { createServer } from 'node:http';
import { readFileSync, appendFileSync, existsSync, statSync, realpathSync } from 'node:fs';
import { join, dirname, resolve, sep, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendRef } from '../scripts/lib/profile-tools.mjs';
import { profilesRoot } from '../scripts/lib/profiles.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2' };
const PRIVATE = new Set(['answers.json', 'ratings.jsonl']); // compared lower-case

export const readDeck = (deckPath) => JSON.parse(readFileSync(deckPath, 'utf8'));

export function ratingState(deckPath) {
  const f = join(dirname(deckPath), 'ratings.jsonl');
  const state = {};
  if (!existsSync(f)) return state;
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { const r = JSON.parse(line); state[r.cardId] = r; } catch { /* skip a torn line */ }
  }
  return state;
}

export function summarise(deckPath) {
  const deck = readDeck(deckPath);
  const state = ratingState(deckPath);
  return deck.cards
    .map((c) => ({ cardId: c.id, title: c.title, love: state[c.id]?.love ?? null, score: state[c.id]?.score ?? null, note: state[c.id]?.note ?? '' }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

function validate(body, deck) {
  if (!body || typeof body !== 'object') return 'body must be JSON';
  if (!deck.cards.some((c) => c.id === body.cardId)) return 'unknown card';
  if (body.love !== undefined && body.love !== null && typeof body.love !== 'boolean') return 'love must be true, false or null';
  if (body.score !== undefined && body.score !== null && !(Number.isInteger(body.score) && body.score >= 1 && body.score <= 5)) return 'score must be 1–5';
  if (body.note !== undefined && typeof body.note !== 'string') return 'note must be text';
  return null;
}

const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

// The project folder is the parent of the nearest `.design` folder above the deck, if any.
export function projectDirFor(deckPath) {
  const parts = resolve(dirname(deckPath)).split(sep);
  const i = parts.lastIndexOf('.design');
  return i > 0 ? parts.slice(0, i).join(sep) || sep : null;
}

export function startBoard(deckPath, { port = 0, host = '127.0.0.1', root = profilesRoot() } = {}) {
  const deckDir = realpathSync(resolve(dirname(deckPath)));
  const deckReal = realpathSync(resolve(deckPath)).toLowerCase();
  const deckLexical = join(deckDir, basename(deckPath)).toLowerCase();
  let boundPort = port;
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) return send(res, 200, readFileSync(join(HERE, 'page.html')), TYPES['.html']);
      if (req.method === 'GET' && ['/page.css', '/page.js'].includes(url.pathname)) return send(res, 200, readFileSync(join(HERE, url.pathname.slice(1))), TYPES[extname(url.pathname)]);
      if (req.method === 'GET' && url.pathname === '/deck') return send(res, 200, readDeck(deckPath));
      if (req.method === 'GET' && url.pathname === '/ratings') return send(res, 200, ratingState(deckPath));
      if (req.method === 'GET' && req.url.startsWith('/files/')) {
        let rel;
        try { rel = decodeURIComponent(req.url.slice('/files/'.length).split('?')[0]); } catch { return send(res, 400, { error: 'bad path' }); }
        const p = resolve(deckDir, rel);
        if (!p.startsWith(deckDir + sep)) return send(res, 403, { error: 'forbidden' });
        // Refuse private names by the requested name too, so case variants get 403 on case-sensitive and case-insensitive filesystems alike.
        if (PRIVATE.has(basename(p).toLowerCase()) || p.toLowerCase() === deckLexical) return send(res, 403, { error: 'forbidden' });
        if (!existsSync(p)) return send(res, 404, { error: 'not found' });
        const real = realpathSync(p);
        if (!real.startsWith(deckDir + sep) || PRIVATE.has(basename(real).toLowerCase()) || real.toLowerCase() === deckReal) return send(res, 403, { error: 'forbidden' });
        if (statSync(real).isDirectory()) return send(res, 404, { error: 'not found' });
        return send(res, 200, readFileSync(p), TYPES[extname(p).toLowerCase()] || 'application/octet-stream');
      }
      if (req.method === 'POST' && url.pathname === '/rate') {
        if (!String(req.headers['content-type'] || '').startsWith('application/json')) return send(res, 415, { error: 'content-type must be application/json' });
        if (![`127.0.0.1:${boundPort}`, `localhost:${boundPort}`].includes(req.headers.host)) return send(res, 403, { error: 'forbidden host' });
        let raw = '';
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > 100_000) return send(res, 413, { error: 'too large' });
        }
        let body;
        try { body = JSON.parse(raw); } catch { return send(res, 400, { error: 'body must be JSON' }); }
        const deck = readDeck(deckPath);
        const err = validate(body, deck);
        if (err) return send(res, 400, { error: err });
        const prev = ratingState(deckPath)[body.cardId] || { love: null, score: null, note: '' };
        const line = {
          cardId: body.cardId,
          love: body.love !== undefined ? body.love : prev.love,
          score: body.score !== undefined ? body.score : prev.score,
          note: body.note !== undefined ? body.note.slice(0, 500) : prev.note,
          at: new Date().toISOString(),
        };
        appendFileSync(join(deckDir, 'ratings.jsonl'), `${JSON.stringify(line)}\n`);
        if (deck.kind === 'refs' && deck.layer && body.love !== undefined && body.love !== null) {
          const card = deck.cards.find((c) => c.id === body.cardId);
          try {
            appendRef({ root, layer: deck.layer, projectDir: projectDirFor(deckPath) || undefined, ref: { src: card.src, title: card.title, love: line.love, score: line.score, why: line.note || card.why || '', at: line.at } });
          } catch (e) {
            return send(res, 200, { ok: true, saved: line, warning: e.message });
          }
        }
        return send(res, 200, { ok: true, saved: line });
      }
      return send(res, 404, { error: 'not found' });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  });
  return new Promise((done) => server.listen(port, host, () => {
    const { port: p } = server.address();
    boundPort = p;
    done({ url: `http://${host}:${p}/`, close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(() => r()); }) });
  }));
}
