import { readdirSync, readFileSync } from 'node:fs';
const assets = new Map();
for (const folder of ['cmaps', 'standard_fonts', 'wasm']) {
  const directory = new URL(`../node_modules/pdfjs-dist/${folder}/`, import.meta.url);
  for (const filename of readdirSync(directory)) {
    const content = readFileSync(new URL(filename, directory));
    assets.set(`/pdf-assets/${folder}/${filename}`, content);
  }
}
export function pdfAssets() {
  return {
    name: 'local-pdf-assets',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = request.url?.split('?')[0];
        if (!assets.has(path)) return next();
        response.setHeader('Content-Type', path.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream');
        response.end(assets.get(path));
      });
    },
    generateBundle() {
      for (const [path, source] of assets) this.emitFile({ type: 'asset', fileName: path.slice(1), source });
    },
  };
}
