import { number, checkbox, output, notice, note } from './fields.js';
export function generator(slug) {
  const random = slug === 'random-string';
  return `<form id="generator-form" class="generator-layout"><section class="settings"><h2>生成设置</h2><div class="settings-fields">${random ? number('length', '字符长度', 20, 1, 256) : ''}${number('count', '生成数量', 1, 1, 1000)}</div>${random ? `<fieldset><legend>字符类型 · 每种至少出现一次</legend><div class="checks">${checkbox('lower', '小写字母 a–z')}${checkbox('upper', '大写字母 A–Z')}${checkbox('digits', '数字 0–9')}${checkbox('symbols', '符号 !@#$…')}</div></fieldset>${checkbox('exclude-similar', '排除易混淆字符 0 O o 1 l I', false)}` : `<div class="checks">${checkbox('uppercase', '大写字母', false)}${checkbox('hyphens', '保留连字符')}</div>`}<button class="primary" type="submit">${random ? '生成字符串' : '生成 UUID'}</button>${note(random ? '由浏览器安全随机源生成。用作临时密码时，有效期需在目标系统中设置。' : '使用浏览器安全随机源生成 UUID v4。每次生成都会替换当前结果。')}</section>${output(13)}</form>${notice}`;
}
