import './shell.js';
import { checkText, copyText, downloadText, status } from './io.js';
import { createTaskClient } from './worker-client.js';
export function mountTextTool(task, getOptions = () => ({})) {
  const input = document.querySelector('#input');
  const output = document.querySelector('#output');
  const client = createTaskClient();
  const cancel = document.querySelector('#cancel');
  let revision = 0;
  const setResult = (value, ready = false) => {
    output.value = value;
    document.querySelectorAll('[data-result-action]').forEach((button) => { button.disabled = !ready; });
  };
  const invalidate = () => { revision++; client.cancel(); cancel.hidden = true; setResult(''); status(); };
  input.addEventListener('input', invalidate);
  document.querySelectorAll('[data-option]').forEach((field) => field.addEventListener('change', invalidate));
  document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', async () => {
    invalidate();
    const current = revision;
    try {
      checkText(input.value);
      cancel.hidden = false;
      status('正在处理…');
      const result = await client.run(task, { text: input.value, action: button.dataset.action, options: getOptions() });
      if (current !== revision) return;
      setResult(result, true);
      status(task === 'json' && button.dataset.action === 'validate' ? 'JSON 语法有效。' : '处理完成。');
    } catch (error) {
      if (current === revision) status(error.message, error.name !== 'AbortError');
    } finally { if (current === revision) cancel.hidden = true; }
  }));
  cancel.addEventListener('click', () => { invalidate(); status('已取消处理。'); });
  document.querySelector('#clear').addEventListener('click', () => { input.value = ''; input.dispatchEvent(new Event('input')); input.focus(); });
  document.querySelector('#copy').addEventListener('click', () => copyText(output.value));
  document.querySelector('#download').addEventListener('click', () => downloadText(output.value, task === 'json' ? 'result.json' : 'result.txt'));
  document.querySelector('#swap')?.addEventListener('click', () => { input.value = output.value; input.dispatchEvent(new Event('input')); input.focus(); });
  window.addEventListener('pagehide', () => client.dispose());
  return { input, output };
}
