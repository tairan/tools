import { setText } from '../../shared/i18n.js';
import '../../shared/shell.js';
import { createTaskClient } from '../../shared/worker-client.js';
import { copyText, downloadText, checkText, formatBytes, status } from '../../shared/io.js';
const client = createTaskClient();
const source = document.querySelector('#hash-source');
const input = document.querySelector('#input');
const fileInput = document.querySelector('#file-input');
const output = document.querySelector('#output');
const progress = document.querySelector('#progress');
const cancel = document.querySelector('#cancel');
let revision = 0;
function invalidate() {
  revision++; client.cancel(); output.value = ''; progress.hidden = true; cancel.hidden = true;
  document.querySelectorAll('[data-result-action]').forEach((button) => { button.disabled = true; });
  status();
}
source.addEventListener('change', () => { invalidate(); document.querySelector('#hash-text').hidden = source.value !== 'text'; document.querySelector('#hash-file').hidden = source.value !== 'file'; });
input.addEventListener('input', invalidate);
document.querySelector('#algorithm').addEventListener('change', invalidate);
fileInput.addEventListener('change', () => { invalidate(); const file = fileInput.files[0]; if (file) setText(document.querySelector('#file-info'), '{name} · {size}', { name: file.name, size: formatBytes(file.size) }); else setText(document.querySelector('#file-info'), '文件分块读取，不上传。'); });
document.querySelector('#calculate').addEventListener('click', async () => {
  invalidate(); const current = revision;
  try {
    const payload = { algorithm: document.querySelector('#algorithm').value };
    if (source.value === 'file') { if (!fileInput.files[0]) throw new Error('请先选择一个本地文件。'); payload.file = fileInput.files[0]; }
    else payload.text = checkText(input.value);
    progress.value = 0; progress.hidden = false; cancel.hidden = false; status('正在计算…');
    const value = await client.run('hash', payload, (percent) => { if (current === revision) progress.value = percent; });
    if (current !== revision) return;
    output.value = value;
    document.querySelectorAll('[data-result-action]').forEach((button) => { button.disabled = false; });
    status('计算完成。');
  } catch (error) { if (current === revision) status(error.message, error.name !== 'AbortError'); }
  finally { if (current === revision) cancel.hidden = true; }
});
cancel.addEventListener('click', () => { invalidate(); status('已取消计算。'); });
document.querySelector('#clear').addEventListener('click', () => { input.value = ''; invalidate(); input.focus(); });
document.querySelector('#clear-file').addEventListener('click', () => { fileInput.value = ''; fileInput.dispatchEvent(new Event('change')); });
document.querySelector('#copy').addEventListener('click', () => copyText(output.value));
document.querySelector('#download').addEventListener('click', () => downloadText(output.value, 'checksum.txt'));
window.addEventListener('pagehide', () => client.dispose());
