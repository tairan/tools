import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tools, validateCatalog } from './src/catalog.js';
import { header, footer, catalog, filters, themeBoot, toolContent } from './build/pages.js';
import { pdfAssets } from './build/pdf-assets.js';

validateCatalog();
for (const tool of tools) {
  if (!existsSync(new URL(`./${tool.slug}/index.html`, import.meta.url))) throw new Error(`Missing tool entry: ${tool.slug}`);
}
const templates = new Map(await Promise.all(tools.filter((tool) => tool.slug !== 'pdf2jpg').map(async (tool) => {
  const module = await import(new URL(`./src/tools/${tool.slug}/template.js`, import.meta.url).href);
  if (typeof module.default !== 'function') throw new Error(`Missing tool template: ${tool.slug}`);
  return [tool.slug, module.default];
})));
const iconVersion = createHash('sha256').update(readFileSync(new URL('./public/favicon.svg', import.meta.url))).digest('hex').slice(0, 12);
export default defineConfig({
  appType: 'mpa',
  worker: { format: 'es' },
  plugins: [pdfAssets(), {
    name: 'tool-pages',
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.startsWith('/assets/')) response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        next();
      });
    },
    transformIndexHtml(html, context) {
      const tool = tools.find((entry) => context.filename === resolve(import.meta.dirname, `${entry.slug}/index.html`));
      return html.replace('<!-- theme-boot -->', themeBoot)
        .replace('<!-- site-header -->', header(tool?.slug === 'pdf2jpg'))
        .replace('<!-- site-footer -->', footer())
        .replace('<!-- tool-catalog -->', catalog())
        .replace('<!-- category-filters -->', filters())
        .replace('<!-- tool-content -->', tool && tool.slug !== 'pdf2jpg' ? toolContent(tool, templates.get(tool.slug)()) : '')
        .replaceAll('href="/favicon.svg"', `href="/favicon.svg?v=${iconVersion}"`);
    },
  }],
  build: {
    rolldownOptions: {
      input: { home: resolve(import.meta.dirname, 'index.html'), ...Object.fromEntries(tools.map((tool) => [tool.slug, resolve(import.meta.dirname, `${tool.slug}/index.html`)])) },
    },
  },
  optimizeDeps: { exclude: ['pdfjs-dist'] },
});
