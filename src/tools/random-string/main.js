import { mountGenerator } from '../../shared/generator.js';
import { generateStrings } from './logic.js';
mountGenerator(generateStrings, () => ({
  length: Number(document.querySelector('#length').value), count: Number(document.querySelector('#count').value),
  groups: ['lower', 'upper', 'digits', 'symbols'].filter((id) => document.getElementById(id).checked),
  excludeSimilar: document.querySelector('#exclude-similar').checked,
}), 'random-strings.txt');
