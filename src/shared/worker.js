import { convertBase64 } from '../tools/base64/logic.js';
import { convertUrl } from '../tools/url-codec/logic.js';
import { transformJson } from '../tools/json/logic.js';
import { transformText, analyzeText } from '../tools/text/logic.js';
import { checkText } from './io.js';
self.onmessage = async ({ data: { task, payload } }) => {
  try {
    if (typeof payload.text === 'string') checkText(payload.text);
    let result;
    switch (task) {
      case 'base64': result = convertBase64(payload.text, payload.action, payload.options); break;
      case 'url-codec': result = convertUrl(payload.text, payload.action, payload.options); break;
      case 'json': result = transformJson(payload.text, payload.action, payload.options); break;
      case 'text': result = transformText(payload.text, payload.action); break;
      case 'text-stats': result = analyzeText(payload.text); break;
      case 'hash': {
        const { hashInput } = await import('../tools/hash/logic.js');
        result = await hashInput(payload.file ?? payload.text, payload.algorithm, (value) => self.postMessage({ type: 'progress', value }));
        break;
      }
      default: throw new Error('不支持的处理操作。');
    }
    self.postMessage({ result });
  } catch (error) { self.postMessage({ error: error.message || '处理失败，请检查输入。' }); }
};
