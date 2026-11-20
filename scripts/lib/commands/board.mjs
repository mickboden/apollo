import { existsSync } from 'node:fs';
import { startBoard, summarise } from '../../../board/server.mjs';
import { parseArgs } from '../args.mjs';

export async function run(argv) {
  const { flags, positionals } = parseArgs(argv, { string: ['port'], boolean: ['json'] });
  const [sub, deck] = positionals;
  if (!['serve', 'results'].includes(sub) || !deck) { console.error('Usage: board serve <deck.json> [--port n] | board results <deck.json> [--json]'); return 2; }
  if (!existsSync(deck)) { console.error(`Deck not found: ${deck}`); return 2; }
  if (sub === 'results') {
    const rows = summarise(deck);
    if (flags.json) console.log(JSON.stringify(rows, null, 2));
    else for (const r of rows) console.log(`${r.score ?? '–'}  ${r.love === true ? '♥' : r.love === false ? '✕' : ' '}  ${r.title || r.cardId}${r.note ? `  — ${r.note}` : ''}`);
    return 0;
  }
  const b = await startBoard(deck, { port: Number(flags.port || 0) });
  console.log(`Board running at ${b.url} (Ctrl-C to stop)`);
  await new Promise((res) => process.on('SIGINT', res));
  await b.close();
  return 0;
}
