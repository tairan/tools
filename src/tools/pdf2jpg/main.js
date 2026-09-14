import { DEFAULT_LOCALE, applyTranslations, getHtmlLang, getIntlLocale, getLocaleLabel, setLocale, supportedLocales, t } from './i18n.js';
import { applyThemeMode, createSystemThemeListener, loadPreferences, saveLocalePreference, saveThemeModePreference, themeModes } from '../../shared/preferences.js';
import { downloadBlob, makeZip } from '../../shared/io.js';
const find = (id) => document.getElementById(id);
const fileInput = find('file-input'), status = find('tool-status');
let currentFile = null, result = null, controller = null, revision = 0, urls = [], currentSection = 'upload', progressState = null, packing = false;
const preferences = loadPreferences(DEFAULT_LOCALE);
let locale = setLocale(preferences.locale), theme = preferences.themeMode;
function message(key, error = false, params = {}) { status.textContent = key ? t(key, params) : ''; status.dataset.state = error ? 'error' : 'info'; }
function show(section) { currentSection = section; ['upload','options','progress','results'].forEach((id) => { find(`section-${id}`).hidden = id !== section; }); }
function release() { urls.forEach((url) => URL.revokeObjectURL(url)); urls = []; result = null; find('thumbnail-grid').replaceChildren(); find('stitch-img').removeAttribute('src'); }
function stop() { revision++; controller?.abort(); controller = null; packing = false; find('zip-cancel').hidden = true; find('btn-download').disabled = false; }
function optionLabel(id, key, value) { find(id).textContent = t(key, { value }); }
function renderOptions() {
  optionLabel('scale-value-display', 'format.scale', find('opt-scale').value);
  optionLabel('quality-value-display', 'format.quality', find('opt-quality').value);
  optionLabel('gap-value-display', 'format.gap', find('opt-gap').value);
  find('gap-row').hidden = !find('opt-stitch').checked;
}
function renderResult() {
  if (!result) return;
  find('results-summary').textContent = result.mode === 'stitch' ? t('results.stitchedSummary', { pages: result.totalPages }) : `${result.pages.length} · ${t('results.multiSummary')}`;
  find('btn-download').textContent = packing ? t('results.packingZip') : t(result.mode === 'stitch' ? 'results.downloadJpg' : 'results.downloadZip');
  find('thumbnail-grid').querySelectorAll('img').forEach((image) => { image.alt = t('results.thumbAlt', { page: image.dataset.page }); });
}
function renderProgress() {
  find('progress-page-info').textContent = progressState ? `${t('format.counter', { current: progressState.current, total: progressState.total })} · ${t('progress.renderingPage', { page: progressState.current })}` : t('progress.readingFile');
}
function translate() {
  setLocale(locale); document.documentElement.lang = getHtmlLang(locale); document.title = `${t('extra.title')} · 太然工具箱`;
  applyTranslations();
  find('theme-mode-select').replaceChildren(...themeModes.map((mode) => { const option = document.createElement('option'); option.value = mode; option.textContent = t(`toolbar.themeModes.${mode}`); return option; }));
  find('theme-mode-select').value = theme;
  find('locale-select').value = locale;
  if (currentFile) find('info-size').textContent = `${new Intl.NumberFormat(getIntlLocale(locale), { maximumFractionDigits: 2 }).format(currentFile.size / 1024)} KiB`;
  renderOptions(); renderProgress(); renderResult(); message('');
}
find('locale-select').replaceChildren(...supportedLocales.map((code) => { const option = document.createElement('option'); option.value = code; option.textContent = getLocaleLabel(code); return option; }));
find('locale-select').addEventListener('change', () => { locale = setLocale(find('locale-select').value); saveLocalePreference(locale); translate(); });
find('theme-mode-select').addEventListener('change', () => { theme = find('theme-mode-select').value; saveThemeModePreference(theme); applyThemeMode(theme); });
const detach = createSystemThemeListener(() => { if (theme === 'system') applyThemeMode(theme); });
applyThemeMode(theme);
function selectFile(file) {
  stop(); release(); currentFile = null; message('');
  if (!file) { show('upload'); return; }
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) { show('upload'); message('errors.onlyPdf', true); return; }
  currentFile = file; find('info-name').textContent = file.name;
  find('info-size').textContent = `${new Intl.NumberFormat(getIntlLocale(locale), { maximumFractionDigits: 2 }).format(file.size / 1024)} KiB`;
  show('options');
}
fileInput.addEventListener('change', () => selectFile(fileInput.files[0]));
const drop = find('drop-zone');
drop.addEventListener('dragover', (event) => { event.preventDefault(); drop.dataset.dragging = 'true'; });
drop.addEventListener('dragleave', () => delete drop.dataset.dragging);
drop.addEventListener('drop', (event) => { event.preventDefault(); delete drop.dataset.dragging; selectFile(event.dataTransfer.files[0]); });
function reset() { stop(); release(); currentFile = null; fileInput.value = ''; show('upload'); message(''); }
find('btn-reset-file').addEventListener('click', reset); find('btn-reset').addEventListener('click', reset);
['opt-scale','opt-quality','opt-gap','opt-stitch'].forEach((id) => find(id).addEventListener('input', renderOptions));
find('pdf-cancel').addEventListener('click', () => { stop(); show(currentFile ? 'options' : 'upload'); message('extra.cancelled'); });
find('zip-cancel').addEventListener('click', () => { stop(); renderResult(); message('extra.cancelled'); });
find('btn-convert').addEventListener('click', async () => {
  if (!currentFile) return;
  stop(); release(); const current = revision;
  controller = new AbortController(); const signal = controller.signal;
  progressState = null; find('pdf-progress').value = 0; renderProgress(); show('progress'); message('');
  const snapshot = currentFile;
  const options = { scale: Number(find('opt-scale').value), quality: Number(find('opt-quality').value) / 100, gap: Number(find('opt-gap').value), signal,
    onProgress(value) { if (current !== revision) return; progressState = value; find('pdf-progress').value = value.current / value.total * 100; renderProgress(); } };
  const stitched = find('opt-stitch').checked;
  try {
    const converter = await import('./pdf-converter.js'); signal.throwIfAborted();
    const bytes = await snapshot.arrayBuffer(); signal.throwIfAborted();
    const converted = await (stitched ? converter.stitchPdfToJpeg(bytes, options) : converter.convertPdfToJpegs(bytes, options));
    if (current !== revision) return;
    result = stitched ? { ...converted, mode: 'stitch' } : { pages: converted, mode: 'pages' };
    find('stitch-preview').hidden = !stitched; find('thumbnail-grid').hidden = stitched;
    if (stitched) { const url = URL.createObjectURL(result.blob); urls.push(url); find('stitch-img').src = url; }
    else for (const { pageNum, blob } of converted) {
      const figure = document.createElement('figure'), image = document.createElement('img'), caption = document.createElement('figcaption');
      const url = URL.createObjectURL(blob); urls.push(url); image.src = url; image.loading = 'lazy'; image.dataset.page = pageNum; caption.textContent = String(pageNum).padStart(3, '0');
      figure.append(image, caption); find('thumbnail-grid').append(figure);
    }
    renderResult(); show('results');
  } catch (error) {
    if (current !== revision) return;
    release(); show('options');
    message(error.code === 'CANVAS_LIMIT' ? 'extra.limits' : error.name === 'PasswordException' ? 'extra.password' : signal.aborted ? 'extra.cancelled' : 'extra.failed', !signal.aborted);
  } finally { if (current === revision) controller = null; }
});
find('btn-download').addEventListener('click', async () => {
  if (!result || !currentFile) return;
  const basename = currentFile.name.replace(/\.pdf$/i, '');
  if (result.mode === 'stitch') { downloadBlob(result.blob, `${basename}.jpg`); message('extra.ready'); return; }
  const current = revision; packing = true; find('btn-download').disabled = true; find('zip-cancel').hidden = false; renderResult();
  try {
    const zip = await makeZip(result.pages.map(({ pageNum, blob }) => ({ name: `page-${String(pageNum).padStart(3, '0')}.jpg`, blob })), () => { if (current !== revision) throw new DOMException('Cancelled', 'AbortError'); });
    if (current !== revision) return;
    downloadBlob(zip, `${basename}.zip`); message('extra.ready');
  } catch { if (current === revision) message('extra.zipFailed', true); }
  finally { if (current === revision) { packing = false; find('btn-download').disabled = false; find('zip-cancel').hidden = true; renderResult(); } }
});
window.addEventListener('pagehide', () => { reset(); detach(); });
translate();
