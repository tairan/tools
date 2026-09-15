import { setText } from './i18n.js';
export const MAX_TEXT_BYTES = 5 * 1024 * 1024;
export function checkText(text) {
  if (new TextEncoder().encode(text).byteLength > MAX_TEXT_BYTES) throw new Error('文本超过 5 MiB，请分段处理。');
  return text;
}
export function status(message = '', error = false) {
  const target = document.querySelector('#tool-status');
  if (!target) return;
  setText(target, message);
  target.dataset.state = error ? 'error' : 'info';
}
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    status('已复制。');
    return true;
  } catch {
    status('无法访问剪贴板，请选中结果后手动复制。', true);
    document.querySelector('#output')?.select();
    return false;
  }
}
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const downloadText = (text, filename = 'result.txt') => downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), filename);
export const formatBytes = (bytes) => bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KiB` : `${(bytes / 1024 ** 2).toFixed(2)} MiB`;
export const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
export async function makeZip(files, onProgress) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  files.forEach(({ name, blob }) => zip.file(name, blob));
  return zip.generateAsync({ type: 'blob', compression: 'STORE' }, ({ percent }) => onProgress?.(percent));
}
