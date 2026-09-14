import { readFileSync } from 'node:fs';
import { categories, tools, getCategory, getCategoryTools, getToolPath } from '../src/catalog.js';
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const mark = readFileSync(new URL('../src/assets/brand/fangting.svg', import.meta.url), 'utf8');
const arrow = '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
export const themeBoot = `<script>(()=>{let m='system';try{m=localStorage.getItem('pdf2img:theme-mode')||m}catch{}document.documentElement.dataset.theme=m==='dark'||(m!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches)?'dark':'light'})()</script>`;
export function header(pdf = false) {
  return `<a class="skip-link" href="#main-content">跳到主要内容</a><header class="site-header"><div class="header-inner"><a class="brand" href="/">${mark}<span>太然<span class="brand-suffix">工具箱</span></span></a><div class="header-controls"><a class="blog-link" href="https://tairan.org/" ${pdf ? 'data-i18n="navigation.blog"' : ''}>太然的博客</a>${pdf ? '<label class="field-inline" for="locale-select"><span data-i18n="toolbar.language">语言</span><select id="locale-select"></select></label>' : ''}<label class="field-inline" for="${pdf ? 'theme-mode-select' : 'theme-mode'}"><span ${pdf ? 'data-i18n="toolbar.theme"' : ''}>外观</span><select id="${pdf ? 'theme-mode-select' : 'theme-mode'}"><option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option></select></label></div></div></header>`;
}
export function footer() { return '<footer class="site-footer"><span>太然工具箱</span><span>在浏览器中完成，内容留在当前页面。</span><a href="https://tairan.org/">tairan.org</a></footer>'; }
function card(tool) { return `<li data-tool="${tool.slug}"><a class="tool-card" href="${getToolPath(tool)}"><span class="card-heading">${escapeHtml(tool.title)}${arrow}</span><span class="card-description">${escapeHtml(tool.description)}</span></a></li>`; }
export function catalog() {
  return categories.map((category) => `<section class="category-group" id="${category.id}" aria-labelledby="heading-${category.id}"><div class="category-heading"><h2 id="heading-${category.id}">${category.title}</h2><p>${category.description}</p></div><ul class="tool-grid">${getCategoryTools(category.id).map(card).join('')}</ul></section>`).join('');
}
export function filters() { return `<a href="#all" data-category="all" aria-current="true">全部工具 <span>${tools.length}</span></a>${categories.map((category) => `<a href="#${category.id}" data-category="${category.id}">${category.title}</a>`).join('')}`; }
export function related(tool) {
  const siblings = getCategoryTools(tool.categoryId).filter((other) => other.slug !== tool.slug).slice(0, 3);
  return siblings.length ? `<section class="related"><h2>相关工具</h2><ul class="related-links">${siblings.map((other) => `<li><a href="${getToolPath(other)}">${other.title}${arrow}</a></li>`).join('')}</ul></section>` : '';
}
export function toolContent(tool, content) {
  const category = getCategory(tool.categoryId);
  return `<nav class="breadcrumbs" aria-label="面包屑"><a href="/">全部工具</a><span aria-hidden="true">/</span><a href="/#${category.id}">${category.title}</a></nav><div class="tool-title"><h1>${escapeHtml(tool.title)}</h1><p>${escapeHtml(tool.description)}</p></div><div class="workspace">${content}</div>${related(tool)}`;
}
