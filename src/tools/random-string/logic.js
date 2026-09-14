export const characterGroups = {
  lower: 'abcdefghijklmnopqrstuvwxyz', upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789', symbols: '!@#$%^&*()-_=+[]{};:,.?/',
};
export function secureIndex(size, cryptoSource = globalThis.crypto) {
  if (!cryptoSource?.getRandomValues) throw new Error('浏览器没有可用的安全随机源，请使用现代浏览器的 HTTPS 页面。');
  const limit = Math.floor(256 / size) * size;
  const byte = new Uint8Array(1);
  do { cryptoSource.getRandomValues(byte); } while (byte[0] >= limit);
  return byte[0] % size;
}
export function generateStrings({ length = 20, count = 1, groups = ['lower', 'upper', 'digits', 'symbols'], excludeSimilar = false } = {}, cryptoSource = globalThis.crypto) {
  if (!Number.isInteger(length) || length < 1 || length > 256) throw new Error('长度请输入 1–256 的整数。');
  if (!Number.isInteger(count) || count < 1 || count > 1000) throw new Error('数量请输入 1–1,000 的整数。');
  const selected = [...new Set(groups)].map((group) => {
    if (!Object.hasOwn(characterGroups, group)) throw new Error('字符类型无效。');
    return excludeSimilar ? characterGroups[group].replace(/[0Oo1lI]/g, '') : characterGroups[group];
  });
  if (!selected.length) throw new Error('请至少选择一种字符类型。');
  if (length < selected.length) throw new Error('长度不能小于已选字符类型的数量。');
  if (!cryptoSource?.getRandomValues) throw new Error('浏览器没有可用的安全随机源，请使用现代浏览器的 HTTPS 页面。');
  const alphabet = selected.join('');
  const limit = Math.floor(256 / alphabet.length) * alphabet.length;
  const buffer = new Uint8Array(4096);
  let offset = buffer.length;
  const character = () => {
    while (true) {
      if (offset === buffer.length) { cryptoSource.getRandomValues(buffer); offset = 0; }
      const value = buffer[offset++];
      if (value < limit) return alphabet[value % alphabet.length];
    }
  };
  const results = [];
  for (let i = 0; i < count; i++) {
    let candidate;
    let attempts = 0;
    do {
      if (++attempts > 100000) throw new Error('随机源未能生成满足条件的结果，请重试。');
      candidate = Array.from({ length }, character).join('');
    } while (!selected.every((group) => [...candidate].some((value) => group.includes(value))));
    results.push(candidate);
  }
  return results.join('\n');
}
