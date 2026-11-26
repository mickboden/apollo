// Minimal Chrome DevTools Protocol client: launch installed Chrome, open pages, send commands.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

export class TargetError extends Error {}
export class ChromeError extends Error {}

const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export function findChrome(env = process.env) {
  if (env.CHROME_PATH) return existsSync(env.CHROME_PATH) ? env.CHROME_PATH : null;
  if (existsSync(MAC_CHROME)) return MAC_CHROME;
  for (const bin of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    const r = spawnSync('which', [bin], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  }
  return null;
}

export function toUrl(target) {
  if (/^(https?|file):\/\//i.test(target)) return target;
  const p = resolve(target);
  if (!existsSync(p)) throw new TargetError(`target not found: ${target}`);
  if (statSync(p).isDirectory()) throw new TargetError(`${target} is a folder: start the dev server and pass its URL`);
  if (!['.html', '.htm', '.svg'].includes(extname(p).toLowerCase())) throw new TargetError(`${target} is not a page: pass a URL or an .html file (start the dev server and pass its URL)`);
  return pathToFileURL(p).href;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Connection {
  constructor(ws, { commandTimeoutMs = 30000 } = {}) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.listeners = new Set(); this.closed = null;
    this.commandTimeoutMs = commandTimeoutMs;
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { res, rej, timer } = this.pending.get(msg.id); this.pending.delete(msg.id); clearTimeout(timer);
        msg.error ? rej(new ChromeError(`${msg.error.message} (${msg.error.code})`)) : res(msg.result);
      } else if (msg.method) for (const l of this.listeners) l(msg);
    });
    const fail = (why) => this.failAll(why);
    ws.addEventListener('close', () => fail('Chrome closed the connection'));
    ws.addEventListener('error', () => fail('Chrome connection error'));
  }
  failAll(why) {
    if (!this.closed) this.closed = why;
    for (const [id, { rej, timer }] of this.pending) { clearTimeout(timer); rej(new ChromeError(why)); this.pending.delete(id); }
  }
  send(method, params = {}, sessionId, timeoutMs = this.commandTimeoutMs) {
    if (this.closed) return Promise.reject(new ChromeError(this.closed));
    const id = ++this.id;
    return new Promise((res, rej) => {
      const timer = setTimeout(() => { if (this.pending.delete(id)) rej(new ChromeError(`Chrome command ${method} timed out after ${timeoutMs}ms`)); }, timeoutMs);
      timer.unref?.();
      this.pending.set(id, { res, rej, timer });
      try { this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); }
      catch (e) { this.pending.delete(id); clearTimeout(timer); rej(new ChromeError(`could not talk to Chrome: ${e.message}`)); }
    });
  }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
}

class Page {
  constructor(conn, sessionId, targetId) { this.conn = conn; this.sessionId = sessionId; this.targetId = targetId; }
  send(method, params, timeoutMs) { return this.conn.send(method, params, this.sessionId, timeoutMs); }
  waitFor(method, timeout = 30000) {
    let cancel = () => {};
    const p = new Promise((res, rej) => {
      const t = setTimeout(() => { off(); rej(new ChromeError(`timeout waiting for ${method}`)); }, timeout);
      t.unref?.();
      const off = this.conn.on((m) => { if (m.sessionId === this.sessionId && m.method === method) { clearTimeout(t); off(); res(m.params); } });
      cancel = () => { clearTimeout(t); off(); };
    });
    p.catch(() => {});
    p.cancel = cancel;
    return p;
  }
  onEvent(method, fn) { return this.conn.on((m) => { if (m.sessionId === this.sessionId && m.method === method) fn(m.params); }); }
  async goto(url, { timeoutMs = 30000 } = {}) {
    let status = null;
    const offResp = this.onEvent('Network.responseReceived', (p) => { if (p.type === 'Document' && p.frameId === this.mainFrameId) status = p.response.status; });
    const loaded = this.waitFor('Page.loadEventFired', timeoutMs);
    try {
      const r = await this.send('Page.navigate', { url }, timeoutMs).catch((e) => {
        if (e instanceof ChromeError && /timed out/.test(e.message)) throw new TargetError(`page did not finish loading in ${Math.round(timeoutMs / 1000)}s: ${url}`);
        throw e;
      });
      if (r.errorText) throw new TargetError(`could not load ${url}: ${r.errorText}`);
      try { await loaded; } catch (e) {
        if (e instanceof ChromeError && /^timeout waiting/.test(e.message)) throw new TargetError(`page did not finish loading in ${Math.round(timeoutMs / 1000)}s: ${url}`);
        throw e;
      }
    } finally { loaded.cancel(); offResp(); }
    if (status !== null && status >= 400) throw new TargetError(`${url} answered HTTP ${status}; check the route and that the dev server is running`);
    await this.eval('document.fonts ? document.fonts.ready.then(() => true) : true');
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new ChromeError(`page script failed: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
    return r.result.value;
  }
  async screenshot(path, opts = {}) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png', ...opts });
    writeFileSync(path, Buffer.from(data, 'base64'));
    return path;
  }
  close() { return this.conn.send('Target.closeTarget', { targetId: this.targetId }); }
}

// --- Launch -------------------------------------------------------------------------------
// Chrome on Linux needs a user-namespace sandbox that containers, CI runners and hardened
// distros often lack; it then dies at once with "No usable sandbox". We retry once with
// --no-sandbox there, and go straight to it as root (Chrome refuses root with a sandbox) or
// in a container, and let APOLLO_CHROME_NO_SANDBOX=1 force it or =0 forbid it.

const STDERR_KEEP = 4000;

export function chromeArgs({ userDir, headless = true, noSandbox = false }) {
  return [`--user-data-dir=${userDir}`, '--remote-debugging-port=0', '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--hide-scrollbars', '--mute-audio', '--force-color-profile=srgb',
    ...(noSandbox ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), ...(headless ? ['--headless=new'] : []), 'about:blank'];
}

// Which sandbox modes to try, in order. Returns e.g. [false, true] = sandboxed, then no-sandbox.
export const inContainer = () => existsSync('/.dockerenv') || existsSync('/run/.containerenv');

export function sandboxPlan({ env = process.env, platform = process.platform, uid = process.getuid?.(), container = inContainer() } = {}) {
  const opt = env.APOLLO_CHROME_NO_SANDBOX;
  if (opt === '1' || opt === 'true') return [true];
  if (opt === '0' || opt === 'false') return [false];
  if (platform !== 'linux') return [false];
  if (uid === 0 || container) return [true];
  return [false, true];
}

// The last useful stderr lines, without crash-dump stack noise.
export function stderrSummary(text) {
  const lines = String(text || '').split('\n').map((l) => l.trim()).filter((l) => l && !/^#\d+ 0x|^Received signal|^\[end of stack trace\]|cpufreq|^Task trace:|^Crash keys:|^\s*"/.test(l));
  const fatal = lines.filter((l) => /FATAL|ERROR|error|denied|sandbox/i.test(l));
  return (fatal.length ? fatal : lines).slice(-3).join('\n').slice(0, 800);
}

function fixFor(stderr) {
  if (/sandbox/i.test(stderr)) return 'Chrome has no usable sandbox here; set APOLLO_CHROME_NO_SANDBOX=1 (containers/CI) or enable unprivileged user namespaces';
  if (/shared librar|cannot open shared object/i.test(stderr)) return 'Chrome is missing system libraries; install the distro\'s Chrome dependencies';
  if (/display|ozone|X server/i.test(stderr)) return 'Chrome wants a display; make sure it runs headless (--headless=new is the default)';
  return 'run `node scripts/cli.mjs doctor` for details';
}

// One launch attempt: spawn Chrome and wait for DevToolsActivePort. Resolves with the live process.
async function startOnce({ bin, headless, noSandbox, spawn: spawnFn, startupMs, tmp }) {
  const userDir = mkdtempSync(join(tmp, 'apollo-chrome-'));
  const proc = spawnFn(bin, chromeArgs({ userDir, headless, noSandbox }), { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  let exited = false; let spawnError = null;
  proc.stderr?.on('data', (d) => { stderr = (stderr + d).slice(-STDERR_KEEP); });
  proc.on('exit', () => { exited = true; });
  proc.on('error', (e) => { spawnError = e; exited = true; });
  const killOnExit = () => { try { proc.kill('SIGKILL'); } catch { /* gone */ } };
  process.once('exit', killOnExit);
  const cleanup = () => { process.removeListener('exit', killOnExit); try { proc.kill('SIGKILL'); } catch { /* gone */ } try { rmSync(userDir, { recursive: true, force: true }); } catch { /* temp */ } };
  const portFile = join(userDir, 'DevToolsActivePort');
  const start = Date.now();
  const failure = (reason, retryable) => { cleanup(); const e = new ChromeError(reason); e.retryable = retryable; e.stderr = stderrSummary(stderr); return e; };
  while (!existsSync(portFile) || !readFileSync(portFile, 'utf8').includes('\n')) {
    if (spawnError) throw failure(`Chrome could not start: ${spawnError.message}`, false);
    if (exited) { await sleep(20); throw failure('Chrome exited during startup', true); }
    if (Date.now() - start > startupMs) throw failure(`Chrome did not start within ${Math.round(startupMs / 1000)}s`, true);
    await sleep(50);
  }
  const [port, path] = readFileSync(portFile, 'utf8').trim().split('\n');
  return { proc, userDir, port, path, noSandbox, killOnExit, isExited: () => exited, stderrTail: () => stderrSummary(stderr) };
}

// Start Chrome, retrying without the sandbox when the plan allows. Exported for tests (inject spawn).
export async function startChrome({ bin, headless = true, env = process.env, spawn: spawnFn = spawn, platform = process.platform, uid = process.getuid?.(), container, startupMs = 20000, tmp = tmpdir() } = {}) {
  const plan = sandboxPlan({ env, platform, uid, ...(container === undefined ? {} : { container }) });
  const errors = [];
  for (const noSandbox of plan) {
    try { return await startOnce({ bin, headless, noSandbox, spawn: spawnFn, startupMs, tmp }); }
    catch (e) {
      errors.push(e);
      if (!e.retryable) break;
    }
  }
  const last = errors.at(-1);
  const tried = plan.length > 1 && errors.length > 1 ? ' (also tried --no-sandbox)' : '';
  const detail = errors.map((e) => e.stderr).filter(Boolean).at(-1);
  const err = new ChromeError(`${last.message}${tried}${detail ? `: ${detail}` : ''}. Fix: ${fixFor(errors.map((e) => e.stderr).join('\n'))}`);
  err.stderr = detail || '';
  throw err;
}

export async function launch({ headless = true, env = process.env, commandTimeoutMs = 30000, spawn: spawnFn = spawn } = {}) {
  const bin = findChrome(env);
  if (!bin) throw new ChromeError(env.CHROME_PATH ? `Chrome not found at CHROME_PATH=${env.CHROME_PATH} (fix the path or unset it)` : 'Chrome not found (set CHROME_PATH or install Google Chrome)');
  const started = await startChrome({ bin, headless, env, spawn: spawnFn });
  const { proc, userDir, port, path, killOnExit } = started;
  const fail = (msg) => { process.removeListener('exit', killOnExit); try { proc.kill('SIGKILL'); } catch { /* gone */ } try { rmSync(userDir, { recursive: true, force: true }); } catch { /* temp */ } return new ChromeError(msg); };
  const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(fail('could not connect to Chrome')), { once: true }); });
  const conn = new Connection(ws, { commandTimeoutMs });
  proc.on('exit', () => conn.failAll('Chrome exited'));
  return {
    process: proc,
    bin,
    noSandbox: started.noSandbox,
    async newPage() {
      const { targetId } = await conn.send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await conn.send('Target.attachToTarget', { targetId, flatten: true });
      const page = new Page(conn, sessionId, targetId);
      await page.send('Page.enable');
      await page.send('Runtime.enable');
      await page.send('Network.enable');
      page.mainFrameId = (await page.send('Page.getFrameTree')).frameTree.frame.id;
      return page;
    },
    async close() {
      const exited = started.isExited();
      if (!exited && !conn.closed) { try { await conn.send('Browser.close', {}, undefined, 3000); } catch { /* fall through to kill */ } }
      conn.failAll('browser closed');
      try { ws.close(); } catch { /* already closed */ }
      if (!exited) proc.kill('SIGKILL');
      await sleep(100);
      try { rmSync(userDir, { recursive: true, force: true }); } catch { /* temp dir */ }
      process.removeListener('exit', killOnExit);
    },
  };
}
