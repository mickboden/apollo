import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startChrome, sandboxPlan, chromeArgs, stderrSummary, ChromeError } from '../scripts/lib/cdp.mjs';

const SANDBOX_FATAL = '[1:1:FATAL:zygote_host_impl_linux.cc(129)] No usable sandbox! If you want to live dangerously and need an immediate workaround, you can try using --no-sandbox.\nReceived signal 6\n#0 0x5573f74d1e73 (/opt/chrome+0x696be72)\n';

// A fake spawn: each scripted attempt either dies with stderr or writes DevToolsActivePort.
function fakeSpawn(script) {
  const calls = [];
  const fn = (bin, args) => {
    const step = script[calls.length] || script.at(-1);
    calls.push(args);
    const proc = new EventEmitter();
    proc.stderr = new PassThrough();
    proc.kill = () => { proc.killed = true; };
    const userDir = args.find((a) => a.startsWith('--user-data-dir=')).split('=')[1];
    setTimeout(() => {
      if (step.stderr) proc.stderr.write(step.stderr);
      if (step.ok) writeFileSync(join(userDir, 'DevToolsActivePort'), '9222\n/devtools/browser/x\n');
      else setTimeout(() => proc.emit('exit', 133), 5);
    }, 5);
    return proc;
  };
  fn.calls = calls;
  return fn;
}
const tmp = () => mkdtempSync(join(tmpdir(), 'apollo-launch-'));
const base = { bin: '/fake/chrome', env: {}, startupMs: 2000, container: false };

test('sandboxPlan: sandbox first on Linux, straight to no-sandbox as root or in a container, env wins', () => {
  assert.deepEqual(sandboxPlan({ env: {}, platform: 'linux', uid: 1000, container: false }), [false, true]);
  assert.deepEqual(sandboxPlan({ env: {}, platform: 'linux', uid: 0, container: false }), [true]);
  assert.deepEqual(sandboxPlan({ env: {}, platform: 'linux', uid: 1000, container: true }), [true]);
  assert.deepEqual(sandboxPlan({ env: {}, platform: 'darwin', uid: 501, container: false }), [false]);
  assert.deepEqual(sandboxPlan({ env: { APOLLO_CHROME_NO_SANDBOX: '1' }, platform: 'darwin', uid: 501 }), [true]);
  assert.deepEqual(sandboxPlan({ env: { APOLLO_CHROME_NO_SANDBOX: '0' }, platform: 'linux', uid: 0 }), [false]);
});

test('chromeArgs adds --no-sandbox only when asked', () => {
  assert.ok(!chromeArgs({ userDir: '/t' }).includes('--no-sandbox'));
  assert.ok(chromeArgs({ userDir: '/t', noSandbox: true }).includes('--no-sandbox'));
  assert.ok(chromeArgs({ userDir: '/t' }).includes('--headless=new'));
});

test('a sandbox crash on Linux is retried with --no-sandbox', async () => {
  const spawn = fakeSpawn([{ stderr: SANDBOX_FATAL }, { ok: true }]);
  const r = await startChrome({ ...base, spawn, platform: 'linux', uid: 1000, tmp: tmp() });
  assert.equal(spawn.calls.length, 2);
  assert.ok(!spawn.calls[0].includes('--no-sandbox'));
  assert.ok(spawn.calls[1].includes('--no-sandbox'));
  assert.equal(r.noSandbox, true);
  assert.equal(r.port, '9222');
});

test('a working sandboxed launch is not retried', async () => {
  const spawn = fakeSpawn([{ ok: true }]);
  const r = await startChrome({ ...base, spawn, platform: 'linux', uid: 1000, tmp: tmp() });
  assert.equal(spawn.calls.length, 1);
  assert.equal(r.noSandbox, false);
});

test('APOLLO_CHROME_NO_SANDBOX=1 launches without the sandbox first time', async () => {
  const spawn = fakeSpawn([{ ok: true }]);
  const r = await startChrome({ ...base, env: { APOLLO_CHROME_NO_SANDBOX: '1' }, spawn, platform: 'darwin', uid: 501, tmp: tmp() });
  assert.equal(spawn.calls.length, 1);
  assert.ok(spawn.calls[0].includes('--no-sandbox'));
  assert.equal(r.noSandbox, true);
});

test('on macOS a crash is not retried and the error carries Chrome\'s stderr and a fix', async () => {
  const spawn = fakeSpawn([{ stderr: '[1:1:FATAL:something.cc] bad things happened\n' }]);
  await assert.rejects(startChrome({ ...base, spawn, platform: 'darwin', uid: 501, tmp: tmp() }), (e) => {
    assert.ok(e instanceof ChromeError);
    assert.match(e.message, /exited during startup/);
    assert.match(e.message, /bad things happened/);
    assert.match(e.message, /Fix:/);
    return true;
  });
  assert.equal(spawn.calls.length, 1);
});

test('when both attempts fail the error says so and names the sandbox fix', async () => {
  const spawn = fakeSpawn([{ stderr: SANDBOX_FATAL }, { stderr: SANDBOX_FATAL }]);
  await assert.rejects(startChrome({ ...base, spawn, platform: 'linux', uid: 1000, tmp: tmp() }), (e) => /also tried --no-sandbox/.test(e.message) && /APOLLO_CHROME_NO_SANDBOX/.test(e.message));
  assert.equal(spawn.calls.length, 2);
});

test('stderrSummary drops stack-trace noise and keeps the fatal line', () => {
  const s = stderrSummary(SANDBOX_FATAL);
  assert.match(s, /No usable sandbox/);
  assert.doesNotMatch(s, /0x5573/);
});
