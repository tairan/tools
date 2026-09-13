import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { tools, getToolPath } from './src/catalog.js';

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

export default defineConfig({
  appType: 'mpa',
  plugins: [{
    name: 'tool-catalog',
    transformIndexHtml(html) {
      return html.replace('<!-- tool-catalog -->', tools.map((tool) => `
        <li class="tool-card">
          <a href="${escapeHtml(getToolPath(tool))}">
            <h2>${escapeHtml(tool.title)} <span aria-hidden="true">↗</span></h2>
            <p>${escapeHtml(tool.description)}</p>
            <span class="tool-card-action">打开工具 →</span>
          </a>
        </li>`).join(''));
    },
  }],
  build: {
    rolldownOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        ...Object.fromEntries(tools.map((tool) => [
          tool.slug, resolve(import.meta.dirname, `${tool.slug}/index.html`),
        ])),
      },
    },
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
});
