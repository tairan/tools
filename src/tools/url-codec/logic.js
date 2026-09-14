export function convertUrl(text, action, { mode = 'component' } = {}) {
  if (!['component', 'uri'].includes(mode)) throw new Error('请选择有效的编码模式。');
  try {
    if (action === 'encode') return mode === 'uri' ? encodeURI(text) : encodeURIComponent(text);
    if (action === 'decode') return mode === 'uri' ? decodeURI(text) : decodeURIComponent(text);
    throw new Error('不支持的操作。');
  } catch { throw new Error('转换失败，请检查百分号编码和 Unicode 字符是否完整。'); }
}
