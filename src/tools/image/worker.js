import { resizeImage } from './logic.js';
self.onmessage = async ({ data }) => {
  try { self.postMessage({ result: await resizeImage(data.file, data.options) }); }
  catch (error) { self.postMessage({ error: error.message || '图片无法解码，请确认文件没有损坏。' }); }
};
