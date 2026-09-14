import { mountGenerator } from '../../shared/generator.js';
import { generateUuids } from './logic.js';
mountGenerator(generateUuids, () => ({ count: Number(document.querySelector('#count').value), uppercase: document.querySelector('#uppercase').checked, hyphens: document.querySelector('#hyphens').checked }), 'uuids.txt');
