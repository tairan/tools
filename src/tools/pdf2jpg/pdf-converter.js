import * as pdfjs from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
// Keep loaded code available for repeated local conversions; documents still release independently.
let sharedWorker;
window.addEventListener('pagehide', () => { sharedWorker?.destroy(); sharedWorker = null; });

function validateCanvas(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1 || width > 32767 || height > 32767 || width * height > 64 * 1024 * 1024) {
    const error = new Error('Canvas limit exceeded'); error.code = 'CANVAS_LIMIT'; throw error;
  }
}
function createCanvas(width, height) {
  validateCanvas(width, height);
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  return canvas;
}
function jpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else { const error = new Error('Canvas export failed'); error.code = 'CANVAS_LIMIT'; reject(error); }
  }, 'image/jpeg', quality));
}
async function withPdf(arrayBuffer, signal, run) {
  signal?.throwIfAborted();
  sharedWorker ??= new pdfjs.PDFWorker();
  const loadingTask = pdfjs.getDocument({ worker: sharedWorker, data: new Uint8Array(arrayBuffer), isEvalSupported: false, enableScripting: false, enableXfa: false, useSystemFonts: true, cMapUrl: '/pdf-assets/cmaps/', cMapPacked: true, standardFontDataUrl: '/pdf-assets/standard_fonts/', wasmUrl: '/pdf-assets/wasm/' });
  let destroyed;
  const destroy = () => { destroyed ??= loadingTask.destroy().catch(() => {}); return destroyed; };
  const abort = () => { void destroy(); };
  signal?.addEventListener('abort', abort, { once: true });
  try { return await run(await loadingTask.promise); }
  finally { signal?.removeEventListener('abort', abort); await destroy(); }
}
async function renderPage(page, scale, signal) {
  signal?.throwIfAborted();
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
  const context = canvas.getContext('2d');
  if (!context) { canvas.width = 0; const error = new Error('Canvas unavailable'); error.code = 'CANVAS_LIMIT'; throw error; }
  let render;
  const abort = () => render?.cancel();
  try {
    render = page.render({ canvas, canvasContext: context, viewport, background: '#ffffff' });
    signal?.addEventListener('abort', abort, { once: true });
    await render.promise; signal?.throwIfAborted(); return canvas;
  } catch (error) { canvas.width = 0; canvas.height = 0; throw error; }
  finally { signal?.removeEventListener('abort', abort); page.cleanup(); }
}
export async function convertPdfToJpegs(arrayBuffer, { scale = 2, quality = 0.92, onProgress, signal } = {}) {
  return withPdf(arrayBuffer, signal, async (pdf) => {
    const results = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      signal?.throwIfAborted();
      const canvas = await renderPage(await pdf.getPage(pageNum), scale, signal);
      try { results.push({ pageNum, blob: await jpegBlob(canvas, quality) }); }
      finally { canvas.width = 0; canvas.height = 0; }
      onProgress?.({ current: pageNum, total: pdf.numPages });
    }
    return results;
  });
}
export async function stitchPdfToJpeg(arrayBuffer, { scale = 2, quality = 0.92, gap = 0, onProgress, signal } = {}) {
  return withPdf(arrayBuffer, signal, async (pdf) => {
    let width = 0, height = gap * Math.max(0, pdf.numPages - 1);
    for (let i = 1; i <= pdf.numPages; i++) {
      signal?.throwIfAborted();
      const page = await pdf.getPage(i), viewport = page.getViewport({ scale });
      width = Math.max(width, Math.round(viewport.width)); height += Math.round(viewport.height); page.cleanup();
      validateCanvas(width, height);
    }
    const stitched = createCanvas(width, height), context = stitched.getContext('2d');
    try {
      if (!context) { const error = new Error('Canvas unavailable'); error.code = 'CANVAS_LIMIT'; throw error; }
      context.fillStyle = '#b0aaa0'; context.fillRect(0, 0, width, height);
      let y = 0;
      for (let i = 1; i <= pdf.numPages; i++) {
        signal?.throwIfAborted();
        const canvas = await renderPage(await pdf.getPage(i), scale, signal);
        try {
          context.fillStyle = '#ffffff'; context.fillRect(0, y, width, canvas.height);
          context.drawImage(canvas, Math.floor((width - canvas.width) / 2), y); y += canvas.height + gap;
        } finally { canvas.width = 0; canvas.height = 0; }
        onProgress?.({ current: i, total: pdf.numPages });
      }
      signal?.throwIfAborted();
      return { blob: await jpegBlob(stitched, quality), totalPages: pdf.numPages };
    } finally { stitched.width = 0; stitched.height = 0; }
  });
}
