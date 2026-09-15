export function timestampToDate(value, unit = 'seconds') {
  if (!/^-?\d+$/.test(value.trim())) throw new Error('时间戳请输入整数，并选择秒或毫秒。');
  if (!['seconds', 'milliseconds'].includes(unit)) throw new Error('时间单位无效。');
  const milliseconds = BigInt(value.trim()) * (unit === 'seconds' ? 1000n : 1n);
  if (milliseconds < -8640000000000000n || milliseconds > 8640000000000000n) throw new Error('时间戳超出浏览器支持的日期范围。');
  return new Date(Number(milliseconds));
}
export function localDateValue(date, utc = false) {
  const get = (part) => date[`get${utc ? 'UTC' : ''}${part}`]();
  const pad = (value, width = 2) => String(value).padStart(width, '0');
  return `${pad(get('FullYear'), 4)}-${pad(get('Month') + 1)}-${pad(get('Date'))}T${pad(get('Hours'))}:${pad(get('Minutes'))}:${pad(get('Seconds'))}.${pad(get('Milliseconds'), 3)}`;
}
export function dateToTimestamp(value, zone = 'local') {
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value);
  if (!parts || !['local', 'utc'].includes(zone)) throw new Error('请输入完整有效的日期和时间。');
  const [, year, month, day, hour, minute, second = '0', fraction = '0'] = parts;
  const expected = [Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second), Number(fraction.padEnd(3, '0'))];
  const date = new Date(0);
  const prefix = zone === 'utc' ? 'UTC' : '';
  date[`set${prefix}FullYear`](...expected.slice(0, 3));
  date[`set${prefix}Hours`](...expected.slice(3));
  const actual = ['FullYear', 'Month', 'Date', 'Hours', 'Minutes', 'Seconds', 'Milliseconds'].map((part) => date[`get${prefix}${part}`]());
  if (actual.some((part, i) => part !== expected[i])) throw new Error('日期无效，或当地夏令时跳转使此时间不存在。请修正日期或使用 UTC。');
  return date;
}
export function describeDate(date, translate = (value) => value) {
  const offset = -date.getTimezoneOffset();
  const sign = offset < 0 ? '-' : '+';
  const zone = `UTC${sign}${String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')}:${String(Math.abs(offset) % 60).padStart(2, '0')}`;
  return `${translate('秒')}：${Math.floor(date.getTime() / 1000)}\n${translate('毫秒')}：${date.getTime()}\nUTC：${date.toISOString()}\n${translate('本地')}：${localDateValue(date)} ${zone}\n${translate('时区')}：${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
}
