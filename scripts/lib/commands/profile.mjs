import { initProfile, UserError } from '../profile-tools.mjs';

export async function run([sub, kind, name]) {
  if (sub !== 'init' || !kind) { console.error('Usage: profile init personal | profile init brand <name>'); return 2; }
  try { console.log(`Created ${initProfile({ kind, name })}`); return 0; }
  catch (e) { if (e instanceof UserError) { console.error(e.message); return 1; } throw e; }
}
