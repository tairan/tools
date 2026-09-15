import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import JSZip from 'jszip';
import { tools } from '../../src/catalog.js';
const fixture = resolve('tests/fixtures/two-pages.pdf');
async function imageBuffer(page, type = 'image/png') {
  const data = await page.evaluate((type) => {
    const canvas = document.createElement('canvas'); canvas.width = 120; canvas.height = 80;
    const context = canvas.getContext('2d'); context.fillStyle = '#2775b6'; context.fillRect(30, 20, 60, 40);
    return canvas.toDataURL(type).split(',')[1];
  }, type);
  return Buffer.from(data, 'base64');
}
async function inspectImage(page, buffer) {
  return page.evaluate(async (bytes) => {
    const bitmap = await createImageBitmap(new Blob([new Uint8Array(bytes)]));
    const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(bitmap, 0, 0);
    const result = { width: bitmap.width, height: bitmap.height, corner: Array.from(ctx.getImageData(0, 0, 1, 1).data), upper: Array.from(ctx.getImageData(Math.floor(bitmap.width / 2), Math.floor(bitmap.height / 4), 1, 1).data), middle: Array.from(ctx.getImageData(Math.floor(bitmap.width / 2), Math.floor(bitmap.height / 2), 1, 1).data) };
    bitmap.close(); return result;
  }, Array.from(buffer));
}

// Every exercised tool must keep processing within the browser, including file paths.
test.beforeEach(async ({ context }) => {
  const outgoing = [];
  context.on('request', request => outgoing.push({ url: request.url(), method: request.method(), body: request.postData() }));
  context._toolRequests = outgoing;
});
test.afterEach(async ({ context }) => {
  expect(context._toolRequests.filter(request => !request.url.startsWith('http://127.0.0.1:4173/') && !request.url.startsWith('blob:http://127.0.0.1:4173/') || request.method !== 'GET' || request.body)).toEqual([]);
  for (const page of context.pages()) {
    if (!page.url().startsWith('http://127.0.0.1:4173/')) continue;
    const keys = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }));
    expect(keys.local.every(key => ['pdf2img:theme-mode', 'pdf2img:locale'].includes(key))).toBe(true);
    expect(keys.session).toEqual([]);
  }
});

test('directory search, category deep links, independent routes and 404', async ({ page, request }) => {
  const requests = []; page.on('request', (request) => requests.push(request.url()));
  await page.goto('/'); await expect(page.locator('[data-tool]:visible')).toHaveCount(11);
  await page.locator('#tool-search').fill('password'); await expect(page.locator('[data-tool]:visible')).toHaveCount(1);
  await expect(page.locator('[data-tool]:visible')).toHaveAttribute('data-tool', 'random-string');
  await page.locator('#tool-search').fill('no-such-tool'); await expect(page.locator('#no-results')).toBeVisible();
  await page.locator('#reset-filters').click(); await page.locator('[data-category="media"]').click();
  await expect(page.locator('[data-tool]:visible')).toHaveCount(3);
  await page.reload(); await expect(page.locator('[data-tool]:visible')).toHaveCount(3);
  expect(requests.some((url) => /pdf-converter|pdf\.worker|jszip|hash-wasm|browser-/.test(url))).toBe(false);
  for (const tool of tools) { const response = await request.get(`/${tool.slug}/`); expect(response.status()).toBe(200); expect(await response.text()).toContain('太然'); }
  expect((await request.get('/does-not-exist/')).status()).toBe(404);
});

test('generators produce correct values, invalidate stale output and export', async ({ page }) => {
  await page.goto('/random-string/'); await page.locator('#count').fill('5');
  await page.locator('#exclude-similar').check(); await page.getByRole('button', { name: '生成字符串', exact: true }).click();
  await expect(page.locator('#output')).not.toHaveValue('');
  const strings = (await page.locator('#output').inputValue()).split('\n'); expect(strings).toHaveLength(5);
  for (const value of strings) { expect(value).toHaveLength(20); expect(value).not.toMatch(/[0Oo1lI]/); }
  const downloadPromise = page.waitForEvent('download'); await page.locator('#download').click();
  expect(await readFile(await (await downloadPromise).path(), 'utf8')).toBe(strings.join('\n'));
  await page.locator('#length').fill('32'); await expect(page.locator('#copy')).toBeDisabled();
  await page.goto('/uuid/'); await page.locator('#count').fill('10'); await page.getByRole('button', { name: '生成 UUID', exact: true }).click();
  await expect(page.locator('#output')).not.toHaveValue('');
  for (const value of (await page.locator('#output').inputValue()).split('\n')) expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('Base64 and URL handle Unicode, errors, switching and clipboard denial', async ({ page }) => {
  await page.goto('/base64/'); await page.locator('#input').fill('太然 🌱'); await page.locator('[data-action="encode"]').click();
  await expect(page.locator('#output')).toHaveValue(Buffer.from('太然 🌱').toString('base64'));
  await page.locator('#swap').click(); await page.locator('[data-action="decode"]').click(); await expect(page.locator('#output')).toHaveValue('太然 🌱');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Denied')) } }));
  await page.locator('#copy').click(); await expect(page.locator('#tool-status')).toContainText('手动复制');
  await page.locator('#input').fill('AB=='); await page.locator('[data-action="decode"]').click(); await expect(page.locator('#tool-status')).toHaveAttribute('data-state', 'error'); await expect(page.locator('#copy')).toBeDisabled();
  await page.goto('/url-codec/'); await page.locator('#input').fill('a+b 太然'); await page.locator('[data-action="encode"]').click(); await expect(page.locator('#output')).toHaveValue(encodeURIComponent('a+b 太然'));
});

test('JSON keeps unsafe integers and provides validation errors; text stats and cleanup work', async ({ page }) => {
  await page.goto('/json/'); await page.locator('#input').fill('{"id":9223372036854775807,"id":-0}'); await page.locator('[data-action="format"]').click();
  await expect(page.locator('#output')).toHaveValue(/9223372036854775807/);
  await page.locator('#input').fill('{"a":1,}'); await page.locator('[data-action="format"]').click(); await expect(page.locator('#tool-status')).toContainText('第 1 行');
  await page.goto('/text/'); await page.locator('#input').fill('太然\nabc\nabc'); await expect(page.locator('#stat-chinese')).toHaveText('2'); await expect(page.locator('#stat-lines')).toHaveText('3');
  await page.locator('[data-action="dedupe"]').click(); await expect(page.locator('#output')).toHaveValue('太然\nabc');
});

test('hashes text and files, cancels safely and can run again', async ({ page }) => {
  await page.goto('/hash/'); await page.locator('#input').fill('abc'); await page.locator('#calculate').click();
  await expect(page.locator('#output')).toHaveValue(createHash('sha256').update('abc').digest('hex'));
  await page.locator('#hash-source').selectOption('file');
  const buffer = Buffer.alloc(3 * 1024 * 1024 + 7, 42);
  await page.locator('#file-input').setInputFiles({ name: 'sample.bin', mimeType: 'application/octet-stream', buffer });
  await page.locator('#calculate').click(); await expect(page.locator('#output')).toHaveValue(createHash('sha256').update(buffer).digest('hex'));
  await page.reload(); await page.locator('#hash-source').selectOption('file'); await page.locator('#file-input').setInputFiles({ name: 'sample.bin', mimeType: 'application/octet-stream', buffer });
  await page.route('**/assets/worker-*.js', async (route) => { await new Promise((resolve) => setTimeout(resolve, 300)); await route.continue().catch(() => {}); });
  await page.locator('#calculate').click(); await page.locator('#cancel').click(); await expect(page.locator('#output')).toHaveValue(''); await expect(page.locator('#tool-status')).toContainText('已取消');
  await page.unrouteAll({ behavior: 'wait' }); await page.locator('#calculate').click(); await expect(page.locator('#output')).toHaveValue(createHash('sha256').update(buffer).digest('hex'));
});

test('timestamp conversion and actual local offsets', async ({ page }) => {
  await page.goto('/timestamp/'); await page.locator('#timestamp').fill('0'); await page.getByRole('button', { name: '转换为日期', exact: true }).click();
  await expect(page.locator('#output')).toHaveValue(/1970-01-01T00:00:00.000Z/);
  await page.locator('#zone').selectOption('utc'); await page.locator('#date').fill('2024-02-29T12:34:56.789'); await page.getByRole('button', { name: '转换为时间戳', exact: true }).click();
  await expect(page.locator('#output')).toHaveValue(/1709210096789/);
});

test('QR exports PNG and SVG and independent decoder restores Unicode input', async ({ page }) => {
  await page.goto('/qrcode/'); const text = 'https://tairan.org/?text=太然🌱';
  await page.locator('#input').fill(text); await page.locator('#generate').click(); await expect(page.locator('#qr-canvas')).toBeVisible();
  await page.addScriptTag({ path: resolve('node_modules/jsqr/dist/jsQR.js') });
  const decoded = await page.evaluate(() => { const canvas = document.querySelector('#qr-canvas'); return window.jsQR(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)?.data; });
  expect(decoded).toBe(text);
  let promise = page.waitForEvent('download'); await page.locator('#download-png').click();
  const bytes = await readFile(await (await promise).path()); expect((await inspectImage(page, bytes)).width).toBe(256);
  promise = page.waitForEvent('download'); await page.locator('#download-svg').click(); expect(await readFile(await (await promise).path(), 'utf8')).toContain('<svg');
  await page.locator('#input').fill('changed'); await expect(page.locator('#download-png')).toBeDisabled();
});

test('images resize, convert transparency, zip outputs and recover from invalid files', async ({ page }) => {
  await page.goto('/image/'); const buffer = await imageBuffer(page);
  await page.locator('#file-input').setInputFiles([{ name: 'one.png', mimeType: 'image/png', buffer }, { name: 'two.png', mimeType: 'image/png', buffer }]);
  await page.locator('#image-format').selectOption('image/jpeg'); await page.locator('#image-width').fill('60'); await page.locator('#process').click(); await expect(page.locator('#download-all')).toBeEnabled();
  const promise = page.waitForEvent('download'); await page.locator('#download-all').click();
  const zip = await JSZip.loadAsync(await readFile(await (await promise).path()));
  expect(Object.keys(zip.files)).toEqual(['01-one.jpg', '02-two.jpg']);
  const image = await inspectImage(page, await zip.file('01-one.jpg').async('nodebuffer'));
  expect(image.width).toBe(60); expect(image.height).toBe(40); expect(image.corner.slice(0, 3).every((value) => value > 245)).toBe(true);
  await page.locator('#file-input').setInputFiles({ name: 'bad.png', mimeType: 'image/png', buffer: Buffer.from('bad image') }); await page.locator('#process').click(); await expect(page.locator('#tool-status')).toContainText('1 张失败');
  await page.locator('#clear').click(); await expect(page.locator('#image-results')).toBeEmpty();
});

test('PDF exports actual multipage JPG ZIP and stitched image; languages survive reload', async ({ page }) => {
  await page.goto('/pdf2jpg/'); await page.locator('#file-input').setInputFiles(fixture); await page.locator('#opt-stitch').uncheck(); await page.locator('#btn-convert').click();
  await expect(page.locator('#section-results')).toBeVisible(); await expect(page.locator('#thumbnail-grid img')).toHaveCount(2);
  let promise = page.waitForEvent('download'); await page.locator('#btn-download').click();
  const zip = await JSZip.loadAsync(await readFile(await (await promise).path())); expect(Object.keys(zip.files)).toEqual(['page-001.jpg', 'page-002.jpg']);
  const first = await inspectImage(page, await zip.file('page-001.jpg').async('nodebuffer')); expect(first.width).toBe(600); expect(first.height).toBe(400); expect(first.upper[2]).toBeGreaterThan(first.upper[0] + 80);
  const second = await inspectImage(page, await zip.file('page-002.jpg').async('nodebuffer')); expect(second.upper[1]).toBeGreaterThan(second.upper[0] + 60);
  await page.locator('#btn-reset').click(); await page.locator('#file-input').setInputFiles(fixture); await page.locator('#opt-stitch').check(); await page.locator('#btn-convert').click(); await expect(page.locator('#section-results')).toBeVisible();
  promise = page.waitForEvent('download'); await page.locator('#btn-download').click();
  const stitched = await inspectImage(page, await readFile(await (await promise).path())); expect(stitched.width).toBe(600); expect(stitched.height).toBe(840);
  for (const [locale, lang] of [['en', 'en'], ['ja', 'ja-JP'], ['zh', 'zh-CN']]) { await page.locator('#locale-select').selectOption(locale); await expect(page.locator('html')).toHaveAttribute('lang', lang); }
  await page.locator('#locale-select').selectOption('en'); await page.reload(); await expect(page.locator('#locale-select')).toHaveValue('en'); await expect(page.locator('h1')).toHaveText('PDF to JPG');
});

test('PDF failure returns to settings and subsequent conversion works', async ({ page }) => {
  await page.goto('/pdf2jpg/'); await page.locator('#file-input').setInputFiles({ name: 'broken.pdf', mimeType: 'application/pdf', buffer: Buffer.from('not a PDF') }); await page.locator('#btn-convert').click();
  await expect(page.locator('#tool-status')).toHaveAttribute('data-state', 'error'); await expect(page.locator('#section-options')).toBeVisible();
  await page.locator('#btn-reset-file').click(); await page.locator('#file-input').setInputFiles(fixture); await page.locator('#btn-convert').click(); await expect(page.locator('#section-results')).toBeVisible();
});

test('all pages fit mobile and desktop in both themes and persist appearance', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', ...tools.map((tool) => `/${tool.slug}/`)]) {
      await page.goto(route); await page.locator(route === '/pdf2jpg/' ? '#theme-mode-select' : '#theme-mode').selectOption(width === 320 || width === 1440 ? 'dark' : 'light');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} at ${width}px`).toBe(true);
    }
  }
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('tool inputs never leave origin or enter persistent storage or location', async ({ page, context }) => {
  const requests = []; const errors = []; page.on('request', (request) => requests.push({ url: request.url(), method: request.method(), data: request.postData() })); page.on('pageerror', (error) => errors.push(error.message));
  const secret = 'tairan-private-marker-abcdef123456';
  for (const [route, action] of [['base64', 'encode'], ['json', 'format'], ['text', 'upper']]) {
    await page.goto(`/${route}/`); await page.locator('#input').fill(route === 'json' ? JSON.stringify({ secret }) : secret); await page.locator(`[data-action="${action}"]`).click(); await expect(page.locator('#output')).not.toHaveValue('');
  }
  const stored = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, url: location.href }));
  expect(JSON.stringify(stored)).not.toContain(secret);
  expect(requests.every((request) => request.url.startsWith('http://127.0.0.1:4173/') && request.method === 'GET' && !request.data)).toBe(true);
  expect(errors).toEqual([]);
  await page.goto('/base64/'); await page.locator('#input').fill(secret); await page.locator('[data-action="encode"]').click(); await expect(page.locator('#output')).not.toHaveValue('');
  await context.setOffline(true); await page.locator('#input').fill('离线太然'); await page.locator('[data-action="encode"]').click(); await expect(page.locator('#output')).toHaveValue(Buffer.from('离线太然').toString('base64'));
});


test('loaded image and PDF resources can be reused offline', async ({ page, context, browserName }) => {
  // WebKit's emulated offline mode blocks local Blob reads too; block HTTP only there.
  const offline = async enabled => {
    if (browserName !== 'webkit') return context.setOffline(enabled);
    if (enabled) await context.route(/^https?:/, route => route.abort('internetdisconnected'));
    else await context.unroute(/^https?:/);
  };
  await page.goto('/image/'); const buffer = await imageBuffer(page);
  await page.locator('#file-input').setInputFiles({ name: 'local.png', mimeType: 'image/png', buffer });
  await page.locator('#process').click(); await expect(page.locator('#download-all')).toBeEnabled();
  await offline(true); await page.locator('#process').click(); await expect(page.locator('#download-all')).toBeEnabled(); await expect(page.locator('#tool-status')).toContainText('已处理 1 张');
  await offline(false); await page.goto('/pdf2jpg/'); await page.locator('#file-input').setInputFiles(fixture); await page.locator('#btn-convert').click(); await expect(page.locator('#section-results')).toBeVisible();
  await offline(true); await page.locator('#btn-reset').click(); await page.locator('#file-input').setInputFiles(fixture); await page.locator('#btn-convert').click(); await expect(page.locator('#section-results')).toBeVisible();
});

test('image and PDF conversion can be cancelled then retried', async ({ page }) => {
  await page.goto('/image/'); const buffer = await imageBuffer(page);
  await page.locator('#file-input').setInputFiles({ name: 'local.png', mimeType: 'image/png', buffer });
  await page.route('**/assets/worker-*.js', async route => { await new Promise(resolve => setTimeout(resolve, 400)); await route.continue().catch(() => {}); });
  await page.locator('#process').click(); await page.locator('#cancel').click(); await expect(page.locator('#tool-status')).toContainText('已取消');
  await page.unrouteAll({ behavior: 'wait' }); await page.locator('#process').click(); await expect(page.locator('#download-all')).toBeEnabled();
  await page.goto('/pdf2jpg/'); await page.locator('#file-input').setInputFiles(fixture);
  await page.route('**/assets/pdf-converter-*.js', async route => { await new Promise(resolve => setTimeout(resolve, 400)); await route.continue().catch(() => {}); });
  await page.locator('#btn-convert').click(); await page.locator('#pdf-cancel').click(); await expect(page.locator('#section-options')).toBeVisible();
  await page.unrouteAll({ behavior: 'wait' }); await page.locator('#btn-convert').click(); await expect(page.locator('#section-results')).toBeVisible();
});

test('keyboard access, theme contrast and no-JavaScript directory remain usable', async ({ page, browser }) => {
  await page.goto('/'); await page.keyboard.press('Tab'); await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.locator('#main-content')).toBeFocused();
  await page.goto('/random-string/');
  for (const theme of ['light', 'dark']) {
    await page.locator('#theme-mode').selectOption(theme);
    const ratios = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const luminance = token => {
        const hex = style.getPropertyValue(token).trim().slice(1);
        const value = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex;
        const rgb = value.match(/../g).map(char => parseInt(char, 16) / 255).map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      };
      const pairs = ['--bg', '--surface', '--surface-alt'].flatMap(background => ['--text', '--text-muted', '--accent-strong', '--danger'].map(foreground => [foreground, background]));
      pairs.push(['--bg', '--accent'], ['--bg', '--accent-strong']);
      return pairs.map(([a, b]) => ({ pair: `${a}/${b}`, ratio: (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05) }));
    });
    for (const { pair, ratio } of ratios) expect(ratio, `${theme} ${pair}`).toBeGreaterThanOrEqual(4.5);
  }
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark' });
  const staticPage = await context.newPage(); await staticPage.goto('http://127.0.0.1:4173/');
  await expect(staticPage.locator('[data-tool]')).toHaveCount(11);
  expect(await staticPage.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgb(16, 28, 37)');
  await staticPage.locator('[data-tool="pdf2jpg"] a').click(); await expect(staticPage).toHaveURL(/\/pdf2jpg\/$/); await context.close();
});
