import '../../shared/shell.js';
import { resizeImage } from './logic.js';
import { downloadBlob, formatBytes, makeZip, nextFrame, status } from '../../shared/io.js';
const fileInput = document.querySelector('#file-input');
const list = document.querySelector('#image-results');
const process = document.querySelector('#process');
const cancel = document.querySelector('#cancel');
const downloadAll = document.querySelector('#download-all');
const progress = document.querySelector('#progress');
let files = [], results = [], urls = [], revision = 0, worker, rejectWorker;
function release() { urls.forEach((url) => URL.revokeObjectURL(url)); urls = []; }
function stop() {
  revision++;
  if (rejectWorker) { worker?.terminate(); worker = null; rejectWorker(new DOMException('已取消处理。', 'AbortError')); rejectWorker = null; }
  cancel.hidden = true; progress.hidden = true; process.disabled = !files.length;
}
function clearResults() { results = []; release(); list.replaceChildren(); downloadAll.disabled = true; }
function showFiles() {
  clearResults();
  files.forEach((file) => {
    const item = document.createElement('li'); item.className = 'image-item';
    const image = document.createElement('img'); image.alt = file.name;
    const url = URL.createObjectURL(file); urls.push(url); image.src = url;
    const copy = document.createElement('div'); const title = document.createElement('h3'); title.textContent = file.name;
    const detail = document.createElement('p'); detail.textContent = `${formatBytes(file.size)} · 等待处理`;
    copy.append(title, detail); item.append(image, copy); list.append(item);
  });
}
function selectFiles(selected) {
  stop(); files = Array.from(selected); clearResults();
  if (files.length > 20) { files = []; process.disabled = true; status('每批最多 20 张，请重新选择。', true); return; }
  if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 30 * 1024 * 1024)) {
    files = []; process.disabled = true; status('请选择 JPG、PNG 或 WebP 图片，每张不超过 30 MiB。', true); return;
  }
  showFiles(); process.disabled = !files.length; status(files.length ? `已选择 ${files.length} 张图片。` : '');
}
fileInput.addEventListener('change', () => selectFiles(fileInput.files));
const drop = document.querySelector('#image-drop');
drop.addEventListener('dragover', (event) => { event.preventDefault(); drop.dataset.dragging = 'true'; });
drop.addEventListener('dragleave', () => delete drop.dataset.dragging);
drop.addEventListener('drop', (event) => { event.preventDefault(); delete drop.dataset.dragging; selectFiles(event.dataTransfer.files); });
function convert(file, options) {
  if (typeof OffscreenCanvas !== 'function' || typeof Worker !== 'function' || typeof createImageBitmap !== 'function') return resizeImage(file, options);
  return new Promise((resolve, reject) => {
    worker ??= new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }); rejectWorker = reject;
    const active = worker;
    const finish = () => { active.onmessage = null; rejectWorker = null; };
    active.onmessage = ({ data }) => { finish(); if (data.error) reject(new Error(data.error)); else resolve(data.result); };
    active.onerror = () => { finish(); active.terminate(); worker = null; reject(new Error('图片处理模块无法运行，请刷新后重试。')); };
    active.postMessage({ file, options });
  });
}
process.addEventListener('click', async () => {
  stop(); showFiles();
  const current = revision;
  const width = document.querySelector('#image-width').value;
  const options = { type: document.querySelector('#image-format').value, quality: Number(document.querySelector('#image-quality').value) / 100, longest: width === '' ? null : Number(width) };
  if (options.longest !== null && (!Number.isInteger(options.longest) || options.longest < 1 || options.longest > 16384)) { status('最长边请输入 1–16,384 的整数，或留空。', true); return; }
  process.disabled = true; cancel.hidden = false; progress.hidden = false; progress.value = 0;
  let failed = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i], row = list.children[i];
    status(`正在处理 ${i + 1} / ${files.length}…`);
    await nextFrame();
    if (current !== revision) return;
    try {
      const result = await convert(file, options);
      if (current !== revision) return;
      const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[options.type];
      const name = `${String(i + 1).padStart(2, '0')}-${file.name.replace(/\.[^.]+$/, '')}.${extension}`;
      results.push({ name, blob: result.blob });
      const url = URL.createObjectURL(result.blob); urls.push(url); row.querySelector('img').src = url;
      const change = file.size ? (result.blob.size - file.size) / file.size * 100 : 0;
      row.querySelector('p').textContent = `${result.width} × ${result.height} · ${formatBytes(file.size)} → ${formatBytes(result.blob.size)}（${change <= 0 ? '减少' : '增加'} ${Math.abs(change).toFixed(1)}%）`;
      const download = document.createElement('button'); download.type = 'button'; download.textContent = '下载图片'; download.addEventListener('click', () => downloadBlob(result.blob, name)); row.append(download);
    } catch (error) {
      if (current !== revision) return;
      failed++; row.querySelector('p').textContent = error.message || '图片无法解码，请确认文件没有损坏。'; row.querySelector('p').className = 'error';
    }
    progress.value = (i + 1) / files.length * 100;
  }
  cancel.hidden = true; process.disabled = false; downloadAll.disabled = !results.length;
  status(`已处理 ${results.length} 张${failed ? `，${failed} 张失败。请检查对应提示后重试。` : '，可下载结果。'}`, failed > 0);
});
downloadAll.addEventListener('click', async () => {
  const current = revision;
  const snapshot = [...results]; downloadAll.disabled = true; cancel.hidden = false; status('正在打包 ZIP…');
  try {
    const zip = await makeZip(snapshot, () => { if (current !== revision) throw new DOMException('已取消。', 'AbortError'); });
    if (current !== revision) return;
    downloadBlob(zip, 'images.zip'); status('ZIP 已准备好。');
  } catch (error) { if (current === revision) status('ZIP 打包失败，请重试或逐张下载。', true); }
  finally { if (current === revision) { cancel.hidden = true; downloadAll.disabled = !results.length; } }
});
cancel.addEventListener('click', () => { stop(); downloadAll.disabled = !results.length; status('已取消。已完成的图片仍可单独下载。'); });
document.querySelector('#clear').addEventListener('click', () => { stop(); files = []; fileInput.value = ''; clearResults(); process.disabled = true; status(); });
document.querySelectorAll('#image-format,#image-quality,#image-width').forEach((field) => field.addEventListener('input', () => {
  stop(); showFiles(); status();
  const png = document.querySelector('#image-format').value === 'image/png';
  document.querySelector('#image-quality').disabled = png;
  document.querySelector('#quality-value').textContent = png ? '无损' : `${document.querySelector('#image-quality').value}%`;
}));
window.addEventListener('pagehide', () => { stop(); worker?.terminate(); worker = null; clearResults(); files = []; fileInput.value = ''; });
