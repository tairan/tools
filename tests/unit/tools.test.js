import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { generateStrings, secureIndex, characterGroups } from '../../src/tools/random-string/logic.js';
import { generateUuids } from '../../src/tools/uuid/logic.js';
import { convertBase64 } from '../../src/tools/base64/logic.js';
import { convertUrl } from '../../src/tools/url-codec/logic.js';
import { transformJson } from '../../src/tools/json/logic.js';
import { transformText, analyzeText } from '../../src/tools/text/logic.js';
import { hashInput } from '../../src/tools/hash/logic.js';
import { timestampToDate, dateToTimestamp, describeDate } from '../../src/tools/timestamp/logic.js';
import { targetSize } from '../../src/tools/image/logic.js';
import { checkText } from '../../src/shared/io.js';
import { tools, categories, validateCatalog, matchesSearch } from '../../src/catalog.js';

test('catalog registers exactly 11 unique working routes with five valid categories', () => {
  assert.equal(tools.length, 11); assert.equal(categories.length, 5); validateCatalog();
  assert.throws(() => validateCatalog([...tools, tools[0]]), /重复/);
  assert.throws(() => validateCatalog([{ ...tools[0], categoryId: 'missing' }]), /分类/);
  assert.ok(matchesSearch(tools.find((tool) => tool.slug === 'random-string'), 'ＰＡＳＳＷＯＲＤ'));
  assert.ok(matchesSearch(tools.find((tool) => tool.slug === 'image'), '图片 webp'));
});
test('rejection sampling discards biased tail bytes', () => {
  const bytes = [255, 252, 17]; let calls = 0;
  assert.equal(secureIndex(10, { getRandomValues(array) { array[0] = bytes[calls++]; return array; } }), 7);
  assert.equal(calls, 3);
});
test('generated strings satisfy selected groups, exclusions and limits', () => {
  const values = generateStrings({ length: 20, count: 1000, excludeSimilar: true }, webcrypto).split('\n');
  assert.equal(values.length, 1000);
  for (const value of values) {
    assert.equal(value.length, 20); assert.doesNotMatch(value, /[0Oo1lI]/);
    for (const group of Object.values(characterGroups)) assert.ok([...value].some((character) => group.includes(character)));
  }
  assert.match(generateStrings({ length: 1, groups: ['digits'] }, webcrypto), /^\d$/);
  for (const options of [{ length: 0 }, { length: 257 }, { count: 1001 }, { count: 1.5 }, { groups: [] }, { length: 2 }, { groups: ['__proto__'] }]) assert.throws(() => generateStrings(options, webcrypto));
  assert.throws(() => generateStrings({}, {}), /安全随机源/);
});
test('UUIDs have the v4 and RFC variant bits in individual and batch forms', () => {
  const uuids = generateUuids({ count: 1000 }, webcrypto).split('\n');
  assert.equal(new Set(uuids).size, 1000);
  for (const uuid of uuids) assert.match(uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.match(generateUuids({ uppercase: true, hyphens: false }, webcrypto), /^[0-9A-F]{32}$/);
  assert.throws(() => generateUuids({ count: 0 }, webcrypto)); assert.throws(() => generateUuids({}, {}), /安全/);
});
test('Base64 RFC vectors, Unicode, BOM and URL-safe round trips', () => {
  for (const [text, encoded] of [['', ''], ['f', 'Zg=='], ['fo', 'Zm8='], ['foo', 'Zm9v'], ['foobar', 'Zm9vYmFy']]) {
    assert.equal(convertBase64(text, 'encode'), encoded); assert.equal(convertBase64(encoded, 'decode'), text);
  }
  for (const text of ['太然\n你好 🌱', '\ufeffhello', 'é👨‍👩‍👧‍👦', 'a'.repeat(100000)]) for (const urlSafe of [true, false]) assert.equal(convertBase64(convertBase64(text, 'encode', { urlSafe }), 'decode', { urlSafe }), text);
  assert.equal(convertBase64(' Z m 8 =\n', 'decode'), 'fo');
  for (const text of ['A', 'AB==', '=Zg=', 'Zg=', 'Zg===', '*', 'Zm9v=']) assert.throws(() => convertBase64(text, 'decode'));
  assert.throws(() => convertBase64('/w==', 'decode'), /UTF-8/);
});
test('URL components and whole URLs preserve their different contracts', () => {
  const url = 'https://tairan.org/太然?q=a+b&x=hello world';
  assert.equal(convertUrl(convertUrl(url, 'encode'), 'decode'), url);
  assert.match(convertUrl(url, 'encode', { mode: 'uri' }), /^https:\/\/tairan.org\//);
  assert.equal(convertUrl('a+b', 'decode'), 'a+b');
  assert.equal(convertUrl('%2F', 'decode', { mode: 'uri' }), '%2F');
  assert.throws(() => convertUrl('%E0%A4', 'decode')); assert.throws(() => convertUrl('\ud800', 'encode'));
});
test('JSON transformations retain integer precision, duplicate keys and numeric lexemes', () => {
  const input = '{ "id":9223372036854775807, "id":-0, "exp":1e400, "text":"a  b\\n中文" }';
  const formatted = transformJson(input, 'format', { indent: 4 });
  assert.match(formatted, /\n {4}"id": 9223372036854775807/);
  assert.match(formatted, /"id": -0/); assert.match(formatted, /1e400/);
  assert.equal(transformJson(formatted, 'minify'), '{"id":9223372036854775807,"id":-0,"exp":1e400,"text":"a  b\\n中文"}');
  assert.equal(transformJson(input, 'validate'), input);
  for (const value of ['null', 'true', '123', '[]', '"text"']) assert.equal(transformJson(value, 'validate'), value);
});
test('JSON strict validation reports a location and rejects extensions', () => {
  for (const input of ['', '{"a":1,}', '{/* no */"a":1}', "{'a':1}", '[NaN]', '[1] garbage']) assert.throws(() => transformJson(input, 'format'), /第 \d+ 行，第 \d+ 列/);
});
test('text statistics use graphemes and cleanup preserves first occurrences', () => {
  assert.deepEqual(analyzeText('太然👨‍👩‍👧‍👦\ne\u0301'), { characters: 5, chinese: 2, lines: 2, bytes: new TextEncoder().encode('太然👨‍👩‍👧‍👦\ne\u0301').length });
  assert.equal(analyzeText('').lines, 0);
  assert.equal(transformText('a\r\nb\r\na\r\nA', 'dedupe'), 'a\nb\nA');
  assert.equal(transformText('a\n \n\nb', 'empty-lines'), 'a\nb');
  assert.equal(transformText('  太然 \n b  ', 'trim'), '太然\nb');
  assert.equal(transformText('Tairan 太然', 'upper'), 'TAIRAN 太然');
});
test('hash algorithms match independent Node vectors for text and chunked files', async () => {
  const bytes = new Uint8Array(2 * 1024 * 1024 + 31); for (let i = 0; i < bytes.length; i++) bytes[i] = i % 251;
  for (const [algorithm, nodeAlgorithm] of [['MD5', 'md5'], ['SHA-1', 'sha1'], ['SHA-256', 'sha256'], ['SHA-512', 'sha512']]) {
    for (const text of ['', 'abc', '太然 🌱']) assert.equal(await hashInput(text, algorithm), createHash(nodeAlgorithm).update(text).digest('hex'));
    const progress = [];
    assert.equal(await hashInput(new Blob([bytes]), algorithm, (value) => progress.push(value)), createHash(nodeAlgorithm).update(bytes).digest('hex'));
    assert.ok(progress.length >= 3); assert.equal(progress.at(-1), 100);
    assert.equal(await hashInput(new Blob([]), algorithm), createHash(nodeAlgorithm).digest('hex'));
  }
});
test('timestamps distinguish units and reject invalid dates rather than normalize them', () => {
  assert.equal(timestampToDate('0').toISOString(), '1970-01-01T00:00:00.000Z');
  assert.equal(timestampToDate('-1', 'milliseconds').getTime(), -1);
  assert.equal(timestampToDate('1704067200', 'seconds').getTime(), 1704067200000);
  assert.equal(dateToTimestamp('2024-02-29T12:34:56.789', 'utc').toISOString(), '2024-02-29T12:34:56.789Z');
  assert.equal(dateToTimestamp('0001-01-01T00:00', 'utc').getUTCFullYear(), 1);
  assert.match(describeDate(new Date(0)), /毫秒：0/);
  for (const value of ['2023-02-29T12:00', '2024-13-01T00:00', '2024-01-01T24:01', 'bad']) assert.throws(() => dateToTimestamp(value, 'utc'));
  for (const value of ['1.2', 'abc', '8640000000000001', '']) assert.throws(() => timestampToDate(value, 'milliseconds'));
});
test('image sizing preserves aspect ratio, avoids upscaling and rejects excessive canvas allocation', () => {
  assert.deepEqual(targetSize(1200, 800, 600), { width: 600, height: 400 });
  assert.deepEqual(targetSize(800, 1200, 600), { width: 400, height: 600 });
  assert.deepEqual(targetSize(100, 50, 1000), { width: 100, height: 50 });
  assert.throws(() => targetSize(100, 50, 0)); assert.throws(() => targetSize(30000, 30000));
  assert.throws(() => checkText('a'.repeat(5 * 1024 * 1024 + 1)), /5 MiB/);
});
