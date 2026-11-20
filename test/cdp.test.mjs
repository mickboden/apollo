import { test } from 'node:test';
import assert from 'node:assert/strict';
import { launch, findChrome, ChromeError } from '../scripts/lib/cdp.mjs';

const skip = findChrome(process.env) ? false : 'Chrome not installed';

test('a CDP command that never answers times out with ChromeError', { skip, timeout: 30000 }, async () => {
  const b = await launch({ commandTimeoutMs: 800 });
  try {
    const page = await b.newPage();
    const t0 = Date.now();
    await assert.rejects(page.eval('new Promise(() => {})'), (e) => e instanceof ChromeError && /timed out/.test(e.message));
    assert.ok(Date.now() - t0 < 5000);
  } finally { await b.close(); }
});

test('pending commands reject when Chrome dies, and close() does not hang', { skip, timeout: 30000 }, async () => {
  const b = await launch();
  const page = await b.newPage();
  const pending = page.eval('new Promise(() => {})');
  b.process.kill('SIGKILL');
  await assert.rejects(pending, ChromeError);
  const t0 = Date.now();
  await b.close();
  assert.ok(Date.now() - t0 < 5000, 'close returned quickly');
});
