import { getIntlLocale } from '../../shared/i18n.js';
import { mountTextTool } from '../../shared/workspace.js';
import { createTaskClient } from '../../shared/worker-client.js';
const { input } = mountTextTool('text');
const stats = createTaskClient();
let timer, revision = 0, lastStats = {};
function renderStats() { for (const [key, value] of Object.entries(lastStats)) document.querySelector(`#stat-${key}`).textContent = value.toLocaleString(getIntlLocale()); }
window.addEventListener('localechange', renderStats);
input.addEventListener('input', () => {
  lastStats = {};
  clearTimeout(timer);
  stats.cancel();
  const current = ++revision;
  for (const key of ['characters', 'chinese', 'lines', 'bytes']) document.querySelector(`#stat-${key}`).textContent = input.value ? '…' : '0';
  if (!input.value) return;
  timer = setTimeout(async () => {
    try {
      const values = await stats.run('text-stats', { text: input.value });
      if (current !== revision) return;
      lastStats = values; renderStats();
    } catch {
      if (current === revision) for (const key of ['characters', 'chinese', 'lines', 'bytes']) document.querySelector(`#stat-${key}`).textContent = '—';
    }
  }, 200);
});
window.addEventListener('pagehide', () => { clearTimeout(timer); stats.dispose(); });
