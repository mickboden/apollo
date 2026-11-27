// Environment check: can this machine run every Apollo gate? Each check says what is wrong and how to fix it.
import { existsSync, accessSync, constants } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { findChrome, launch } from './cdp.mjs';
import { profilesRoot } from './profiles.mjs';
import { nodeProblem } from './node-version.mjs';
import { locateSkill } from './migrate.mjs';

export { nodeProblem };

export const PLUGIN_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const check = (name, status, detail, fix = '', blocking = status === 'fail') => ({ name, status, detail, fix, blocking });

// The Superpowers process skills Apollo reads when installed (skills/director/references/upstream.md, "Process skills").
export const SUPERPOWERS_SKILLS = ['systematic-debugging', 'verification-before-completion', 'receiving-code-review', 'dispatching-parallel-agents',
  'subagent-driven-development', 'brainstorming', 'writing-plans', 'test-driven-development', 'using-git-worktrees', 'finishing-a-development-branch'];

// Optional upstream: always status "info", never blocking, never a failure.
export function superpowersCheck({ home = homedir(), locateFn = locateSkill } = {}) {
  try {
    const found = SUPERPOWERS_SKILLS.filter((s) => locateFn(`superpowers:${s}`, { home }));
    if (!found.length) return check('superpowers', 'info', 'not installed (optional; Apollo\'s own steps cover fix loops, verification and briefing)', '', false);
    const where = dirname(locateFn(`superpowers:${found[0]}`, { home }));
    return check('superpowers', 'info', `installed: ${found.length} of ${SUPERPOWERS_SKILLS.length} process skills Apollo uses (${where})`, '', false);
  } catch (e) {
    return check('superpowers', 'info', `could not check (${String(e.message || e)}); optional`, '', false);
  }
}

export async function runChecks({ env = process.env, version = process.version, pluginRoot = PLUGIN_ROOT, chrome = true, findChromeFn = findChrome, launchFn = launch, home = env.HOME || homedir(), locateFn = locateSkill } = {}) {
  const out = [];
  const np = nodeProblem(version);
  out.push(np ? check('node', 'fail', `Node ${version}`, np) : check('node', 'ok', `Node ${version}`));

  const bin = findChromeFn(env);
  if (!bin) {
    out.push(check('chrome', 'fail', env.CHROME_PATH ? `CHROME_PATH=${env.CHROME_PATH} does not exist` : 'Chrome not found',
      'Install Google Chrome or Chromium, or set CHROME_PATH to the browser binary. Without it the render and motion gates cannot run.'));
  } else {
    out.push(check('chrome', 'ok', bin));
    if (chrome) {
      let b;
      try {
        b = await launchFn({ env, commandTimeoutMs: 10000 });
        const page = await b.newPage();
        const two = await page.eval('1 + 1');
        if (two !== 2) throw new Error('page script returned the wrong value');
        out.push(b.noSandbox
          ? check('chrome-launch', 'ok', 'launches headless, but only with --no-sandbox (normal in containers and CI; Apollo does this by itself)')
          : check('chrome-launch', 'ok', 'launches headless with the sandbox'));
      } catch (e) {
        out.push(check('chrome-launch', 'fail', String(e.message || e).split('. Fix:')[0],
          /Fix: (.*)$/s.exec(String(e.message))?.[1] || 'Try APOLLO_CHROME_NO_SANDBOX=1, or point CHROME_PATH at a different Chrome build.'));
      } finally { try { await b?.close(); } catch { /* best effort */ } }
    }
  }

  const prof = profilesRoot(env);
  if (!existsSync(prof)) {
    out.push(check('profiles', 'warn', `${prof} does not exist yet`, 'Optional: the base taste applies until you run `profile init personal`.', false));
  } else {
    try { accessSync(prof, constants.W_OK); out.push(check('profiles', 'ok', prof)); }
    catch { out.push(check('profiles', 'warn', `${prof} is not writable`, 'Fix its permissions or set APOLLO_PROFILES_DIR to a writable folder; learned lessons cannot be saved.', false)); }
  }

  const missing = ['.claude-plugin/plugin.json', 'skills/director/SKILL.md', 'scripts/cli.mjs'].filter((f) => !existsSync(join(pluginRoot, f)));
  if (missing.length) out.push(check('plugin-root', 'fail', `${pluginRoot} is missing ${missing.join(', ')}`, 'Reinstall the plugin or run the CLI from a full checkout.'));
  else if (!env.CLAUDE_PLUGIN_ROOT) out.push(check('plugin-root', 'ok', `${pluginRoot} (CLAUDE_PLUGIN_ROOT not set: outside Claude Code, run scripts as node ${join(pluginRoot, 'scripts/cli.mjs')})`));
  else if (resolve(env.CLAUDE_PLUGIN_ROOT) !== pluginRoot) out.push(check('plugin-root', 'warn', `CLAUDE_PLUGIN_ROOT=${env.CLAUDE_PLUGIN_ROOT} but this CLI lives in ${pluginRoot}`, 'Two copies are installed; remove the stale one or run the CLI under CLAUDE_PLUGIN_ROOT.', false));
  else out.push(check('plugin-root', 'ok', pluginRoot));

  out.push(superpowersCheck({ home, locateFn }));
  return out;
}

export function formatChecks(checks) {
  const mark = { ok: 'ok  ', warn: 'warn', fail: 'FAIL', info: 'info' };
  const lines = checks.map((c) => `${mark[c.status]}  ${c.name.padEnd(13)} ${c.detail}${c.fix ? `\n      fix: ${c.fix}` : ''}`);
  const blocking = checks.filter((c) => c.blocking).length;
  lines.push('', blocking ? `doctor: ${blocking} blocking problem${blocking > 1 ? 's' : ''}` : 'doctor: ready');
  return lines.join('\n');
}
