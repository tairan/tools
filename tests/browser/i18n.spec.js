import { test, expect } from '@playwright/test';
import { tools } from '../../src/catalog.js';

test('all pages translate their UI and metadata and fit narrow screens', async ({ page }) => {
  for (const locale of ['en', 'ja', 'zh']) {
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['/', ...tools.map((tool) => `/${tool.slug}/`)]) {
        await page.goto(route);
        await page.locator('#locale-select').selectOption(locale);
        await expect(page.locator('html')).toHaveAttribute('lang', { en: 'en', ja: 'ja-JP', zh: 'zh-CN' }[locale]);
        await expect(page.locator('#locale-select option')).toHaveCount(3);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${locale} ${route} ${width}px`).toBe(true);
        if (route === '/' && locale === 'en' && width === 1440) await page.screenshot({ path: test.info().outputPath('home-en-desktop.png'), fullPage: true });
        if (route === '/random-string/' && locale === 'ja' && width === 320) await page.screenshot({ path: test.info().outputPath('random-ja-mobile.png'), fullPage: true });
        if (locale === 'en') {
          await expect(page).toHaveTitle(/Tairan Tools/);
          if (route === '/') await expect(page.locator('h1')).toHaveText('Handy tools, whenever you need them.');
          expect(await page.locator('meta[name="description"]').getAttribute('content')).not.toMatch(/\p{Script=Han}/u);
          const untranslated = await page.evaluate(() => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            const values = [];
            while (walker.nextNode()) {
              const node = walker.currentNode;
              if (node.parentElement.closest('script, noscript, #locale-select')) continue;
              const text = node.textContent.trim();
              if (/\p{Script=Han}/u.test(text) && text !== '太然') values.push(text);
            }
            return values;
          });
          expect(untranslated, route).toEqual([]);
        }
      }
    }
  }
});

test('switching retains inputs, outputs, errors and preferences across tools', async ({ page }) => {
  await page.goto('/base64/');
  await page.locator('#input').fill('已复制。 <b>太然</b>');
  await page.locator('[data-action="encode"]').click();
  await expect(page.locator('#output')).not.toHaveValue('');
  const result = await page.locator('#output').inputValue();
  await page.locator('#locale-select').selectOption('en');
  await expect(page.locator('#input')).toHaveValue('已复制。 <b>太然</b>');
  await expect(page.locator('#output')).toHaveValue(result);
  await expect(page.locator('#copy')).toBeEnabled();
  await expect(page.locator('#tool-status')).toHaveText('Processing complete.');
  await page.locator('#input').fill('AB==');
  await page.locator('[data-action="decode"]').click();
  await expect(page.locator('#tool-status')).toHaveText('Invalid Base64 padding bits.');
  await page.locator('#locale-select').selectOption('ja');
  await expect(page.locator('#tool-status')).toHaveText('Base64 のパディングビットが無効です。');
  await page.goto('/pdf2jpg/');
  await expect(page.locator('#locale-select')).toHaveValue('ja');
  await page.locator('#locale-select').selectOption('en');
  await page.goto('/');
  await expect(page.locator('#locale-select')).toHaveValue('en');
  await page.locator('#tool-search').fill('パスワード');
  await expect(page.locator('[data-tool]:visible')).toHaveCount(1);
  await page.locator('#locale-select').selectOption('ja');
  await expect(page.locator('#tool-search')).toHaveValue('パスワード');
  await expect(page.locator('#search-status')).toHaveText('ツール数：1');
  await page.reload();
  await expect(page.locator('#locale-select')).toHaveValue('ja');
});

test('browser language detection and blocked storage still allow language switching', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'ja-JP' });
  await context.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/uuid/');
  await expect(page.locator('#locale-select')).toHaveValue('ja');
  await page.locator('#locale-select').selectOption('en');
  await page.getByRole('button', { name: 'Generate UUIDs', exact: true }).click();
  await expect(page.locator('#tool-status')).toHaveText('Results generated: 1.');
  await expect(page.locator('#output')).not.toHaveValue('');
  await context.close();
});

test('timestamp output relabels without changing the represented time', async ({ page }) => {
  await page.goto('/timestamp/');
  await page.locator('#timestamp').fill('0');
  await page.locator('#timestamp-form button').click();
  await page.locator('#locale-select').selectOption('en');
  await expect(page.locator('#output')).toHaveValue(/Seconds：0\nMilliseconds：0\nUTC：1970-01-01T00:00:00.000Z/);
  await page.locator('#locale-select').selectOption('ja');
  await expect(page.locator('#output')).toHaveValue(/ミリ秒：0/);
});


test('language changes during worker processing use the new language on completion', async ({ page }) => {
  await page.goto('/json/');
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route('**/assets/worker-*.js', async (route) => { await gate; await route.continue(); });
  await page.locator('#input').fill('{"id":9223372036854775807}');
  await page.locator('[data-action="format"]').click();
  await page.locator('#locale-select').selectOption('ja');
  await expect(page.locator('#tool-status')).toHaveText('処理中…');
  release();
  await expect(page.locator('#tool-status')).toHaveText('処理が完了しました。');
  await expect(page.locator('#output')).toHaveValue(/9223372036854775807/);
  await page.locator('#input').fill('{"a":1,}');
  await page.locator('[data-action="format"]').click();
  await expect(page.locator('#tool-status')).toContainText('1 行目');
  await page.locator('#locale-select').selectOption('en');
  await expect(page.locator('#tool-status')).toContainText('JSON syntax error at line 1,');
});

test('selected files and media results survive language switches', async ({ page }) => {
  await page.goto('/image/');
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = 16; canvas.height = 16;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve));
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  });
  await page.locator('#file-input').setInputFiles({ name: '已复制。.png', mimeType: 'image/png', buffer: Buffer.from(bytes) });
  await page.locator('#locale-select').selectOption('en');
  await expect(page.locator('.image-item h3')).toHaveText('已复制。.png');
  await expect(page.locator('.image-item p')).toContainText('Waiting');
  await page.locator('#process').click();
  await expect(page.locator('#download-all')).toBeEnabled();
  await expect(page.locator('#tool-status')).toHaveText('Images processed: 1. Ready to download.');
  await page.locator('#locale-select').selectOption('ja');
  await expect(page.locator('.image-item button')).toHaveText('画像をダウンロード');
  await expect(page.locator('#download-all')).toBeEnabled();
  await expect(page.locator('.image-item h3')).toHaveText('已复制。.png');
  await page.goto('/pdf2jpg/');
  await page.locator('#file-input').setInputFiles('tests/fixtures/two-pages.pdf');
  await page.locator('#locale-select').selectOption('en');
  await expect(page.locator('#info-name')).toHaveText('two-pages.pdf');
  await expect(page.locator('#section-options')).toBeVisible();
  await page.locator('#btn-convert').click();
  await expect(page.locator('#section-results')).toBeVisible();
  const source = await page.locator('#stitch-img').getAttribute('src');
  await page.locator('#locale-select').selectOption('ja');
  await expect(page.locator('#stitch-img')).toHaveAttribute('src', source);
  await expect(page.locator('#btn-download')).toBeEnabled();
});
