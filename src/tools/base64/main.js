import { mountTextTool } from '../../shared/workspace.js';
mountTextTool('base64', () => ({ urlSafe: document.querySelector('#base64-mode').value === 'url' }));
