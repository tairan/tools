import { setText, t } from '../../shared/i18n.js';
import '../../shared/shell.js';
import { copyText, downloadText, status } from '../../shared/io.js';
import { timestampToDate, dateToTimestamp, localDateValue, describeDate } from './logic.js';
const output = document.querySelector('#output');
const zone = document.querySelector('#zone');
setText(zone.options[0], '本地 · {zone}', { zone: Intl.DateTimeFormat().resolvedOptions().timeZone });
let currentDate = null;
function show(date) { currentDate = date; output.value = describeDate(date, t); document.querySelectorAll('[data-result-action]').forEach((button) => { button.disabled = false; }); status('转换完成。'); }
function convert(callback) { try { show(callback()); } catch (error) { clearResult(); status(error.message, true); } }
function clearResult() { currentDate = null; output.value = ''; document.querySelectorAll('[data-result-action]').forEach((button) => { button.disabled = true; }); status(); }
document.querySelector('#timestamp-form').addEventListener('submit', (event) => { event.preventDefault(); convert(() => timestampToDate(document.querySelector('#timestamp').value, document.querySelector('#unit').value)); });
document.querySelector('#date-form').addEventListener('submit', (event) => { event.preventDefault(); convert(() => dateToTimestamp(document.querySelector('#date').value, zone.value)); });
document.querySelectorAll('form input, form select').forEach((input) => input.addEventListener('input', clearResult));
document.querySelector('#use-now').addEventListener('click', () => { const date = new Date(); document.querySelector('#timestamp').value = String(document.querySelector('#unit').value === 'seconds' ? Math.floor(date.getTime() / 1000) : date.getTime()); document.querySelector('#date').value = localDateValue(date, zone.value === 'utc'); show(date); });
document.querySelector('#copy').addEventListener('click', () => copyText(output.value));
document.querySelector('#download').addEventListener('click', () => downloadText(output.value, 'timestamp.txt'));
const tick = () => { document.querySelector('#clock').textContent = String(Math.floor(Date.now() / 1000)); };
tick();
const timer = setInterval(tick, 1000);
window.addEventListener('pagehide', () => clearInterval(timer));

window.addEventListener('localechange', () => { if (currentDate) output.value = describeDate(currentDate, t); });
