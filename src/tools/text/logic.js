export function analyzeText(text) {
  let characters = 0;
  for (const _ of new Intl.Segmenter('zh-CN', { granularity: 'grapheme' }).segment(text)) characters++;
  let chinese = 0;
  for (const _ of text.matchAll(/\p{Script=Han}/gu)) chinese++;
  return { characters, chinese, lines: text ? text.split(/\r\n|\r|\n/).length : 0, bytes: new TextEncoder().encode(text).length };
}
export function transformText(text, action) {
  switch (action) {
    case 'upper': return text.toUpperCase();
    case 'lower': return text.toLowerCase();
    case 'dedupe': return [...new Set(text.split(/\r\n|\r|\n/))].join('\n');
    case 'empty-lines': return text.split(/\r\n|\r|\n/).filter((line) => line.trim()).join('\n');
    case 'trim': return text.split(/\r\n|\r|\n/).map((line) => line.trim()).join('\n');
    default: throw new Error('不支持的操作。');
  }
}
