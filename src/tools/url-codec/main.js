import { mountTextTool } from '../../shared/workspace.js';
mountTextTool('url-codec', () => ({ mode: document.querySelector('#url-mode').value }));
