export function convertBase64(text, action, { urlSafe = false } = {}) {
  if (action === 'encode') {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    const encoded = btoa(binary);
    return urlSafe ? encoded.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '') : encoded;
  }
  if (action !== 'decode') throw new Error('不支持的操作。');
  const value = text.replace(/[\t\n\r ]/g, '');
  const alphabet = urlSafe ? /^[A-Za-z0-9_-]*={0,2}$/ : /^[A-Za-z0-9+/]*={0,2}$/;
  const body = value.replace(/=+$/, '');
  if (!alphabet.test(value) || body.length % 4 === 1 || (value.includes('=') && value.length % 4 !== 0)) throw new Error('Base64 格式无效，请检查字符、填充和编码模式。');
  const standard = body.replaceAll('-', '+').replaceAll('_', '/');
  let binary;
  try { binary = atob(standard); } catch { throw new Error('Base64 格式无效。'); }
  if (btoa(binary).replace(/=+$/, '') !== standard) throw new Error('Base64 填充位无效。');
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
  } catch { throw new Error('解码结果不是有效 UTF-8 文本；本工具用于文本转换。'); }
}
