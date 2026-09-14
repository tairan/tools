import './shell.js';
import { copyText, downloadText, status, nextFrame } from './io.js';
export function mountGenerator(generate, getOptions, filename) {
  const form = document.querySelector('#generator-form');
  const output = document.querySelector('#output');
  const results = document.querySelectorAll('[data-result-action]');
  let revision = 0;
  const invalidate = () => { revision++; output.value = ''; results.forEach((button) => { button.disabled = true; }); status(); };
  form.addEventListener('input', (event) => { if (event.target !== output) invalidate(); });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    invalidate();
    const current = revision;
    status('正在生成…');
    await nextFrame();
    if (current !== revision) return;
    try {
      output.value = generate(getOptions());
      results.forEach((button) => { button.disabled = false; });
      status(`已生成 ${output.value.split('\n').length} 个结果。`);
    } catch (error) { status(error.message, true); }
  });
  document.querySelector('#copy').addEventListener('click', () => copyText(output.value));
  document.querySelector('#download').addEventListener('click', () => downloadText(output.value, filename));
}
