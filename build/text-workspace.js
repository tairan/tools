import { select, action, cancel, textInput, output, button, notice, note } from './fields.js';
export function textWorkspace(slug) {
  let options = '', actions = '', hint = '', placeholder = '在此输入或粘贴文本';
  if (slug === 'base64') {
    options = select('base64-mode', '编码模式', [['standard', '标准 Base64'], ['url', 'URL-safe Base64']], 'data-option');
    actions = action('encode', '编码为 Base64', true) + action('decode', '解码为文本');
    hint = '支持 UTF-8 中文、Emoji 与换行。URL-safe 模式使用 - 和 _，输出省略填充。Base64 是编码，不用于保密。';
  } else if (slug === 'url-codec') {
    options = select('url-mode', '处理模式', [['component', '参数编码'], ['uri', '完整 URL']], 'data-option');
    actions = action('encode', '编码', true) + action('decode', '解码');
    hint = '参数模式会编码 /、?、& 等分隔符；完整 URL 模式保留网址结构。加号 + 始终保留其字面含义，不作为空格处理。';
  } else if (slug === 'json') {
    options = select('indent', '缩进', [['2', '2 个空格'], ['4', '4 个空格']], 'data-option');
    actions = action('format', '格式化', true) + action('minify', '压缩') + action('validate', '校验');
    hint = '使用严格 JSON 语法，不接受注释或尾随逗号。格式化与压缩保留数字原文、字段顺序和重复字段。';
    placeholder = '{"message":"你好，太然","id":9223372036854775807}';
  } else {
    actions = action('dedupe', '逐行去重', true) + action('empty-lines', '去空行') + action('trim', '清理行首尾空白') + action('upper', '转大写') + action('lower', '转小写');
    hint = '去重区分大小写，保留第一次出现的完整行及原有顺序。清理操作只写入结果，不覆盖输入。';
  }
  const stats = slug === 'text' ? '<dl class="text-stats" aria-label="文本统计"><div><dt>字符</dt><dd id="stat-characters">0</dd></div><div><dt>中文字符</dt><dd id="stat-chinese">0</dd></div><div><dt>行数</dt><dd id="stat-lines">0</dd></div><div><dt>UTF-8 字节</dt><dd id="stat-bytes">0</dd></div></dl>' : '';
  return `<div class="tool-options">${options}<div class="actions">${actions}${cancel}</div></div>${stats}<div class="editors">${textInput(placeholder)}${output()}</div><div class="result-secondary">${button('swap', '将结果用作输入', 'data-result-action disabled')}</div>${notice}${note(hint)}${note('文本上限 5 MiB；输入和结果不自动保存。')}`;
}
