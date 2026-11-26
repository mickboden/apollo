import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runChecks, formatChecks, nodeProblem, PLUGIN_ROOT } from '../scripts/lib/doctor.mjs';
import { main } from '../scripts/cli.mjs';
import { findChrome } from '../scripts/lib/cdp.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = () => mkdtempSync(join(tmpdir(), 'apollo-doc-'));
const fakeBrowser = (noSandbox) => async () => ({ noSandbox, async newPage() { return { eval: async () => 2 }; }, async close() {} });
const byName = (checks) => Object.fromEntries(checks.map((c) => [c.name, c]));

test('nodeProblem: 22+ passes, older Node gets a message with a fix', () => {
  assert.equal(nodeProblem('v22.0.0'), null);
  assert.equal(nodeProblem('v24.19.0'), null);
  assert.match(nodeProblem('v20.11.1'), /Node 22 or newer \(found v20\.11\.1\).*nvm install 22/);
});

test('the CLI refuses to run on old Node with a clear message and exit 2', async () => {
  const errs = []; const orig = console.error; console.error = (m) => errs.push(m);
  try { assert.equal(await main(['--help'], { version: 'v18.19.0' }), 2); } finally { console.error = orig; }
  assert.match(errs.join('\n'), /needs Node 22/);
});

test('package.json declares engines node >=22', async () => {
  const pkg = JSON.parse((await import('node:fs')).readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.engines.node, '>=22');
});

test('doctor: all good → no blocking checks; reports when --no-sandbox was needed', async () => {
  const prof = tmp();
  const c = byName(await runChecks({ env: { APOLLO_PROFILES_DIR: prof }, version: 'v22.3.0', findChromeFn: () => '/fake/chrome', launchFn: fakeBrowser(true) }));
  assert.equal(c.node.status, 'ok');
  assert.equal(c.chrome.status, 'ok');
  assert.equal(c['chrome-launch'].status, 'ok');
  assert.match(c['chrome-launch'].detail, /--no-sandbox/);
  assert.equal(c.profiles.status, 'ok');
  assert.equal(c['plugin-root'].status, 'ok');
  assert.ok(!Object.values(c).some((x) => x.blocking));
});

test('doctor: missing Chrome and old Node are blocking, each with a fix; missing profiles only warn', async () => {
  const checks = await runChecks({ env: { APOLLO_PROFILES_DIR: join(tmp(), 'nope') }, version: 'v20.0.0', findChromeFn: () => null });
  const c = byName(checks);
  assert.equal(c.node.status, 'fail'); assert.ok(c.node.blocking); assert.match(c.node.fix, /nvm install 22/);
  assert.equal(c.chrome.status, 'fail'); assert.ok(c.chrome.blocking); assert.match(c.chrome.fix, /CHROME_PATH/);
  assert.equal(c['chrome-launch'], undefined);
  assert.equal(c.profiles.status, 'warn'); assert.equal(c.profiles.blocking, false); assert.match(c.profiles.fix, /profile init personal/);
  assert.match(formatChecks(checks), /doctor: 2 blocking problems/);
});

test('doctor: a Chrome that will not launch is blocking and carries the launch fix', async () => {
  const launchFn = async () => { throw new Error('Chrome exited during startup: No usable sandbox!. Fix: set APOLLO_CHROME_NO_SANDBOX=1'); };
  const c = byName(await runChecks({ env: { APOLLO_PROFILES_DIR: tmp() }, findChromeFn: () => '/fake/chrome', launchFn }));
  assert.equal(c['chrome-launch'].status, 'fail');
  assert.ok(c['chrome-launch'].blocking);
  assert.match(c['chrome-launch'].fix, /APOLLO_CHROME_NO_SANDBOX=1/);
  assert.doesNotMatch(c['chrome-launch'].detail, /Fix:/);
});

test('doctor: a broken plugin root is blocking; a mismatched CLAUDE_PLUGIN_ROOT warns', async () => {
  const opts = { env: { APOLLO_PROFILES_DIR: tmp() }, chrome: false, findChromeFn: () => '/fake/chrome' };
  assert.equal(byName(await runChecks({ ...opts, pluginRoot: tmp() }))['plugin-root'].status, 'fail');
  const w = byName(await runChecks({ ...opts, env: { ...opts.env, CLAUDE_PLUGIN_ROOT: '/somewhere/else' } }))['plugin-root'];
  assert.equal(w.status, 'warn');
  assert.equal(byName(await runChecks({ ...opts, env: { ...opts.env, CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT } }))['plugin-root'].status, 'ok');
});

test('doctor: an unwritable profiles folder warns', { skip: process.getuid?.() === 0 ? 'root can write anywhere' : false }, async () => {
  const prof = tmp(); chmodSync(prof, 0o500);
  try { assert.equal(byName(await runChecks({ env: { APOLLO_PROFILES_DIR: prof }, chrome: false, findChromeFn: () => 'x' })).profiles.status, 'warn'); }
  finally { chmodSync(prof, 0o700); }
});

test('cli doctor exits 1 with a fix when Chrome is missing', () => {
  const r = spawnSync(process.execPath, [join(root, 'scripts/cli.mjs'), 'doctor'], { encoding: 'utf8', env: { ...process.env, CHROME_PATH: '/nonexistent/chrome', APOLLO_PROFILES_DIR: tmp() } });
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stdout, /FAIL\s+chrome/);
  assert.match(r.stdout, /fix: .*CHROME_PATH/);
});

test('cli doctor exits 0 on a machine with a working Chrome', { skip: findChrome(process.env) ? false : 'Chrome not installed', timeout: 40000 }, () => {
  const r = spawnSync(process.execPath, [join(root, 'scripts/cli.mjs'), 'doctor', '--json'], { encoding: 'utf8', env: { ...process.env, APOLLO_PROFILES_DIR: tmp() } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const c = byName(JSON.parse(r.stdout));
  assert.equal(c['chrome-launch'].status, 'ok');
});
