export function generateUuids({ count = 1, uppercase = false, hyphens = true } = {}, cryptoSource = globalThis.crypto) {
  if (!Number.isInteger(count) || count < 1 || count > 1000) throw new Error('数量请输入 1–1,000 的整数。');
  if (!cryptoSource?.randomUUID) throw new Error('浏览器没有可用的安全 UUID 生成器，请使用现代浏览器的 HTTPS 页面。');
  return Array.from({ length: count }, () => {
    let value = cryptoSource.randomUUID();
    if (!hyphens) value = value.replaceAll('-', '');
    return uppercase ? value.toUpperCase() : value;
  }).join('\n');
}
