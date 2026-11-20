import { locateSkill } from '../migrate.mjs';

export async function run([name]) {
  if (!name) { console.error('Usage: locate <skill-name>'); return 2; }
  const p = locateSkill(name);
  if (!p) { console.error(`${name}: not installed`); return 1; }
  console.log(p);
  return 0;
}
