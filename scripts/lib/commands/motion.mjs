import { join } from 'node:path';
import { measureMotion } from '../motion.mjs';
import { TargetError, ChromeError } from '../cdp.mjs';
import { loadContext } from '../profiles.mjs';
import { parseArgs } from '../args.mjs';

export async function run(argv) {
  const { flags, positionals } = parseArgs(argv, { string: ['click', 'hover', 'eval', 'ms', 'project', 'out', 'dial'], boolean: ['reduced', 'json'] });
  if (!positionals[0]) { console.error('Usage: motion <url|file> [--click sel|--hover sel|--eval js] [--ms 2000] [--reduced] [--dial calm] [--project dir] [--json]'); return 2; }
  const trigger = flags.click ? { type: 'click', selector: flags.click } : flags.hover ? { type: 'hover', selector: flags.hover } : flags.eval ? { type: 'eval', expr: flags.eval } : { type: 'load' };
  const dial = flags.dial || loadContext({ projectDir: flags.project || process.cwd() }).dials.motion;
  try {
    const r = await measureMotion(positionals[0], { trigger, dial, durationMs: Number(flags.ms || 2000), reducedMotion: !!flags.reduced, outDir: flags.out || join('.apollo/motion', new Date().toISOString().replace(/[:.]/g, '-')) });
    if (flags.json) console.log(JSON.stringify({ dial, ...r }, null, 2));
    else {
      console.log(`motion @${dial}: ${r.animations.length} animations, ${r.frames.dropped} dropped frames, p95 ${r.frames.p95ms}ms`);
      for (const a of r.animations) console.log(`  · ${a.name}: ${a.properties.join(', ')} ${a.durationMs}ms ${a.easing}${a.exemption ? ` [${a.exemption}]` : ''}`);
      console.log(r.violations.length ? r.violations.map((v) => `FAIL ${v.rule}: ${v.detail}`).join('\n') : 'motion: no violations');
      console.log(`flipbook: ${r.flipbook}`);
    }
    return r.violations.length ? 1 : 0;
  } catch (e) {
    if (e instanceof TargetError || e instanceof ChromeError) { console.error(`motion not run: ${e.message}`); return 2; }
    throw e;
  }
}
