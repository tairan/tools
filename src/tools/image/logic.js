export function targetSize(width, height, longest = null) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) throw new Error('图片尺寸无效。');
  if (longest !== null && (!Number.isInteger(longest) || longest < 1 || longest > 16384)) throw new Error('最长边请输入 1–16,384 的整数，或留空保留尺寸。');
  const ratio = longest === null ? 1 : Math.min(1, longest / Math.max(width, height));
  const result = { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
  if (result.width > 16384 || result.height > 16384 || result.width * result.height > 32 * 1024 * 1024) throw new Error('输出画布过大，请设置更小的最长边。');
  return result;
}
async function decodeImage(file) {
  if (typeof createImageBitmap === 'function') return createImageBitmap(file, { imageOrientation: 'from-image' });
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally { URL.revokeObjectURL(url); }
}
export async function resizeImage(file, { type = 'image/webp', quality = 0.8, longest = null } = {}) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('仅支持 JPG、PNG 和 WebP 图片。');
  if (file.size > 30 * 1024 * 1024) throw new Error('图片超过 30 MiB，请先减小文件。');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) throw new Error('输出格式无效。');
  if (!Number.isFinite(quality) || quality < 0.1 || quality > 1) throw new Error('质量请输入 10%–100%。');
  let bitmap, canvas;
  try {
    bitmap = await decodeImage(file);
    const dimensions = targetSize(bitmap.width || bitmap.naturalWidth, bitmap.height || bitmap.naturalHeight, longest);
    canvas = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(dimensions.width, dimensions.height) : document.createElement('canvas');
    canvas.width = dimensions.width; canvas.height = dimensions.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('浏览器无法创建画布，请减小输出尺寸。');
    if (type === 'image/jpeg') { context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = canvas.convertToBlob ? await canvas.convertToBlob({ type, quality }) : await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    if (!blob || blob.type !== type) throw new Error('浏览器无法输出此格式或尺寸，请选择 PNG 或减小尺寸后重试。');
    return { blob, ...dimensions };
  } finally {
    bitmap?.close?.();
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }
}
