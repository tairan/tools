import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLocale, t } from '../../src/shared/i18n.js';
import { messages } from '../../src/shared/locales/messages.js';
import { matchesSearch, tools } from '../../src/catalog.js';

test('locale negotiation respects saved preferences, regional codes and fallback', () => {
  assert.equal(resolveLocale('ja', ['en-US']), 'ja');
  assert.equal(resolveLocale('invalid', ['fr-FR', 'en-GB']), 'en');
  assert.equal(resolveLocale('', ['ja-JP']), 'ja');
  assert.equal(resolveLocale('zh-CN', ['en']), 'zh');
  assert.equal(resolveLocale('de', ['de-DE']), 'zh');
});

test('all messages have English and Japanese translations with matching parameters', () => {
  const tokens = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
  for (const [source, translations] of Object.entries(messages)) {
    for (const locale of ['en', 'ja']) {
      assert.ok(translations[locale], `${locale}: ${source}`);
      assert.deepEqual(tokens(translations[locale]), tokens(source), source);
    }
  }
});

test('worker error locations and dynamic counts translate without touching data parameters', () => {
  assert.equal(t('已生成 2 个结果。', {}, 'en'), 'Results generated: 2.');
  assert.equal(t('JSON 语法错误：第 2 行，第 7 列。请检查引号、逗号和括号。', {}, 'en'), 'JSON syntax error at line 2, column 7. Check quotes, commas and brackets.');
  assert.equal(t('{name} · {size}', { name: '<b>已复制。</b>', size: '1 KiB' }, 'ja'), '<b>已复制。</b> · 1 KiB');
  assert.equal(t('已选择 {count} 张图片。', { count: 3 }, 'zh'), '已选择 3 张图片。');
});

test('search finds tools by translated names and descriptions in every language', () => {
  const random = tools.find((tool) => tool.slug === 'random-string');
  for (const query of ['密码', 'password', 'パスワード', 'ランダム']) assert.ok(matchesSearch(random, query));
  assert.ok(matchesSearch(tools.find((tool) => tool.slug === 'qrcode'), 'QR コード'));
});
