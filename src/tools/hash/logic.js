import { createMD5, createSHA1, createSHA256, createSHA512 } from 'hash-wasm';
const algorithms = { MD5: createMD5, 'SHA-1': createSHA1, 'SHA-256': createSHA256, 'SHA-512': createSHA512 };
export async function hashInput(input, algorithm = 'SHA-256', onProgress = () => {}) {
  if (!Object.hasOwn(algorithms, algorithm)) throw new Error('不支持的哈希算法。');
  const hasher = await algorithms[algorithm]();
  hasher.init();
  if (typeof input === 'string') hasher.update(input);
  else {
    const chunkSize = 1024 * 1024;
    for (let offset = 0; offset < input.size; offset += chunkSize) {
      hasher.update(new Uint8Array(await input.slice(offset, offset + chunkSize).arrayBuffer()));
      onProgress(Math.min(100, Math.round((offset + chunkSize) / input.size * 100)));
    }
  }
  onProgress(100);
  return hasher.digest('hex');
}
