import { mountTextTool } from '../../shared/workspace.js';
mountTextTool('json', () => ({ indent: Number(document.querySelector('#indent').value) }));
