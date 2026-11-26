// Browser side of the blind sheets: settled full-page shots, motion frames over time, and composing a sheet
// by screenshotting an HTML layout (no image library needed).
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { sleep } from '../../scripts/lib/cdp.mjs';
import { pickFrames } from './sheets.mjs';

async function viewport(page, vp, scale = 1) {
  await page.send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: scale, mobile: !!vp.mobile });
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }, { name: 'prefers-reduced-motion', value: 'no-preference' }] });
}

const pageHeight = (page) => page.eval('Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0)');

// Scroll through once (so scroll reveals fire), return to the top, then wait until finite animations finish.
export async function settle(page, { maxMs = 6000, minMs = 1200 } = {}) {
  const t0 = Date.now();
  await page.eval(`(async () => { const h = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0); for (let y = 0; y < h; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); } scrollTo(0, 0); return true; })()`);
  while (Date.now() - t0 < maxMs) {
    const busy = await page.eval(`document.getAnimations().filter((a) => a.playState === 'running' && Number.isFinite(a.effect?.getComputedTiming().endTime)).length`);
    if (!busy && Date.now() - t0 >= minMs) break;
    await sleep(100);
  }
  await page.eval('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))');
}

async function fullShot(page, vp, path) {
  const fullHeight = Math.ceil(await pageHeight(page));
  const height = Math.max(1, Math.min(fullHeight, vp.capHeight));
  const { data } = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: vp.width, height, scale: 1 } });
  writeFileSync(path, Buffer.from(data, 'base64'));
  return { path, height, fullHeight };
}

// A settled full-page shot (capped at vp.capHeight).
export async function shootStatic(browser, file, vp, path) {
  const page = await browser.newPage();
  try {
    await viewport(page, vp);
    await page.goto(pathToFileURL(file).href);
    await settle(page);
    return await fullShot(page, vp, path);
  } finally { await page.close().catch(() => {}); }
}

// Four frames over the recording plus the settled end state. Load triggers record from navigation;
// click triggers record from the click. A missing trigger element falls back to recording the page at rest.
export async function shootMotion(browser, file, vp, motion, { prefix }) {
  const page = await browser.newPage();
  const frames = []; let note = null;
  try {
    await viewport(page, vp);
    const off = page.onEvent('Page.screencastFrame', ({ data, metadata, sessionId }) => {
      page.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
      frames.push({ data, ts: metadata.timestamp * 1000 });
    });
    const load = !motion.trigger || motion.trigger.type === 'load';
    let t0;
    if (load) {
      await page.send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: vp.width, maxHeight: vp.height, everyNthFrame: 1 });
      t0 = Date.now();
      await page.goto(pathToFileURL(file).href);
    } else {
      await page.goto(pathToFileURL(file).href);
      await settle(page, { maxMs: 4000, minMs: 600 });
      await page.send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: vp.width, maxHeight: vp.height, everyNthFrame: 1 });
      await sleep(150);
      t0 = Date.now();
      const box = await page.eval(`(() => { const el = document.querySelector(${JSON.stringify(motion.trigger.selector)}); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      if (box) {
        await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y });
        await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 });
        await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 });
      } else note = `trigger ${motion.trigger.selector} not found; recorded the page at rest`;
    }
    const left = motion.durationMs - (Date.now() - t0);
    if (left > 0) await sleep(left);
    await page.send('Page.stopScreencast');
    off();
    const timed = frames.map((f) => ({ ...f, ms: f.ts - t0 })).filter((f) => f.ms >= -50);
    const chosen = pickFrames(timed, motion.durationMs).map((f, i) => {
      const path = `${prefix}-frame${i + 1}.jpg`;
      writeFileSync(path, Buffer.from(f.data, 'base64'));
      return { path, at: f.at, ms: Math.round(f.ms) };
    });
    if (!load) await page.eval('scrollTo(0, 0)');
    await settle(page, { maxMs: 4000, minMs: 300 });
    const end = await fullShot(page, vp, `${prefix}-end.png`);
    return { frames: chosen, end, note };
  } finally { await page.close().catch(() => {}); }
}

// Screenshot an HTML layout page at its full height.
export async function composeSheet(browser, htmlFile, pngPath, { width } = {}) {
  const page = await browser.newPage();
  try {
    await page.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await page.goto(pathToFileURL(htmlFile).href);
    await page.eval('Promise.all([...document.images].map((i) => i.decode().catch(() => null))).then(() => true)');
    const height = Math.min(16000, Math.ceil(await pageHeight(page)));
    const { data } = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height, scale: 1 } });
    writeFileSync(pngPath, Buffer.from(data, 'base64'));
    return { path: pngPath, width, height };
  } finally { await page.close().catch(() => {}); }
}
