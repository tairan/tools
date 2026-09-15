import { setText } from './shared/i18n.js';
import './shared/shell.js';
import { categories, tools, matchesSearch } from './catalog.js';
const input = document.querySelector('#tool-search');
const reset = document.querySelector('#reset-filters');
let category = categories.some((group) => `#${group.id}` === location.hash) ? location.hash.slice(1) : 'all';
function update() {
  const matching = tools.filter((tool) => (category === 'all' || tool.categoryId === category) && matchesSearch(tool, input.value));
  const slugs = new Set(matching.map((tool) => tool.slug));
  document.querySelectorAll('[data-tool]').forEach((item) => { item.hidden = !slugs.has(item.dataset.tool); });
  document.querySelectorAll('.category-group').forEach((group) => { group.hidden = !matching.some((tool) => tool.categoryId === group.id); });
  document.querySelectorAll('[data-category]').forEach((link) => { if (link.dataset.category === category) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current'); });
  setText(document.querySelector('#search-status'), '共 {count} 个工具', { count: matching.length });
  document.querySelector('#no-results').hidden = matching.length !== 0;
  reset.hidden = !input.value && category === 'all';
}
document.querySelectorAll('[data-category]').forEach((link) => link.addEventListener('click', (event) => {
  event.preventDefault(); category = link.dataset.category;
  history.replaceState(null, '', category === 'all' ? location.pathname : `#${category}`);
  update();
}));
input.addEventListener('input', update);
reset.addEventListener('click', () => { category = 'all'; input.value = ''; history.replaceState(null, '', location.pathname); update(); input.focus(); });
window.addEventListener('hashchange', () => { category = categories.some((group) => `#${group.id}` === location.hash) ? location.hash.slice(1) : 'all'; update(); });
update();

window.addEventListener('localechange', update);
