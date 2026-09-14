import { mountTextTool } from '../../shared/workspace.js';
import { createTaskClient } from '../../shared/worker-client.js';
const { input } = mountTextTool('text');
const stats = createTaskClient();
let timer, revision = 0;
input.addEventListener('input', () => {
  clearTimeout(timer);
  stats.cancel();
  const current = ++revision;
  for (const key of ['characters', 'chinese', 'lines', 'bytes']) document.querySelector(`#stat-${key}`).textContent = input.value ? '…' : '0';
  if (!input.value) return;
  timer = setTimeout(async () => {
    try {
      const values = await stats.run('text-stats', { text: input.value });
      if (current !== revision) return;
      for (const [key, value] of Object.entries(values)) document.querySelector(`#stat-${key}`).textContent = value.toLocaleString('zh-CN');
    } catch {
      if (current === revision) for (const key of ['characters', 'chinese', 'lines', 'bytes']) document.querySelector(`#stat-${key}`).textContent = '—';
    }
  }, 200);
});
window.addEventListener('pagehide', () => { clearTimeout(timer); stats.dispose(); });
