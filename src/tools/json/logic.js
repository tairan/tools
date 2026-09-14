import { visit, format, applyEdits, createScanner, SyntaxKind } from 'jsonc-parser';
export function transformJson(text, action, { indent = 2 } = {}) {
  let problem;
  visit(text, { onError: (code, offset, length, line, character) => { problem ??= { line, character }; } }, { disallowComments: true, allowTrailingComma: false, allowEmptyContent: false });
  if (problem) throw new Error(`JSON 语法错误：第 ${problem.line + 1} 行，第 ${problem.character + 1} 列。请检查引号、逗号和括号。`);
  if (action === 'validate') return text;
  if (action === 'format') return applyEdits(text, format(text, undefined, { tabSize: Number(indent) === 4 ? 4 : 2, insertSpaces: true, eol: '\n' }));
  if (action === 'minify') {
    const scanner = createScanner(text, true);
    const tokens = [];
    while (scanner.scan() !== SyntaxKind.EOF) tokens.push(text.slice(scanner.getTokenOffset(), scanner.getTokenOffset() + scanner.getTokenLength()));
    return tokens.join('');
  }
  throw new Error('不支持的操作。');
}
