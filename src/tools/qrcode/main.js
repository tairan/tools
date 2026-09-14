import '../../shared/shell.js';
import { downloadBlob, status } from '../../shared/io.js';
const input = document.querySelector('#input');
const canvas = document.querySelector('#qr-canvas');
const png = document.querySelector('#download-png');
const svg = document.querySelector('#download-svg');
let svgContent = '', revision = 0;
function invalidate() { revision++; svgContent = ''; canvas.hidden = true; canvas.width = 0; canvas.height = 0; document.querySelector('#qr-empty').hidden = false; png.disabled = true; svg.disabled = true; status(); }
[input, document.querySelector('#qr-size'), document.querySelector('#qr-level')].forEach((field) => field.addEventListener('input', invalidate));
document.querySelector('#generate').addEventListener('click', async () => {
  invalidate(); const current = revision;
  try {
    if (!input.value.trim()) throw new Error('请输入要编码的文字或链接。');
    if (new TextEncoder().encode(input.value).length > 2953) throw new Error('内容超出单个二维码容量，请缩短文字。');
    status('正在生成…');
    const { default: QRCode } = await import('qrcode');
    if (current !== revision) return;
    const options = { width: Number(document.querySelector('#qr-size').value), errorCorrectionLevel: document.querySelector('#qr-level').value, margin: 4, color: { dark: '#000000ff', light: '#ffffffff' } };
    const temporary = document.createElement('canvas');
    await QRCode.toCanvas(temporary, input.value, options);
    const markup = await QRCode.toString(input.value, { ...options, type: 'svg' });
    if (current !== revision) { temporary.width = 0; return; }
    canvas.width = temporary.width; canvas.height = temporary.height;
    canvas.getContext('2d').drawImage(temporary, 0, 0); temporary.width = 0;
    svgContent = markup; canvas.hidden = false; document.querySelector('#qr-empty').hidden = true;
    png.disabled = false; svg.disabled = false; status('二维码已生成。');
  } catch (error) { if (current === revision) status(error.message.includes('amount of data') ? '内容超过当前纠错等级的容量，请缩短文字或降低纠错等级。' : error.message, true); }
});
document.querySelector('#clear').addEventListener('click', () => { input.value = ''; invalidate(); input.focus(); });
png.addEventListener('click', () => { const current = revision; canvas.toBlob((blob) => { if (current !== revision) return; if (blob) downloadBlob(blob, 'qrcode.png'); else status('PNG 导出失败，请重新生成。', true); }, 'image/png'); });
svg.addEventListener('click', () => downloadBlob(new Blob([svgContent], { type: 'image/svg+xml' }), 'qrcode.svg'));
window.addEventListener('pagehide', invalidate);
