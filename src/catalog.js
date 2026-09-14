export const categories = [
  { id: 'generate', title: '生成与校验', description: '生成标识，校验内容。' },
  { id: 'encoding', title: '编码与数据', description: '让数据换一种表达。' },
  { id: 'text', title: '文本处理', description: '整理文字，减少重复。' },
  { id: 'time', title: '时间与日期', description: '在时间与数字间换算。' },
  { id: 'media', title: '图片与文档', description: '转换、缩放与导出。' },
];
export const tools = [
  { slug: 'random-string', title: '随机字符串', description: '生成临时密码与随机字符串，自选长度和字符。', categoryId: 'generate', keywords: ['password', '密码', 'token', '随机数'], order: 10 },
  { slug: 'uuid', title: 'UUID 生成', description: '生成 UUID v4，支持批量复制与下载。', categoryId: 'generate', keywords: ['guid', '唯一标识', 'id'], order: 20 },
  { slug: 'hash', title: '哈希计算', description: '计算文本或文件的 MD5、SHA 校验值。', categoryId: 'generate', keywords: ['checksum', 'md5', 'sha1', 'sha256', 'sha512', '校验'], order: 30 },
  { slug: 'base64', title: 'Base64 编解码', description: '文本与 Base64 互转，支持中文和 URL-safe。', categoryId: 'encoding', keywords: ['encode', 'decode', '编码', '解码'], order: 40 },
  { slug: 'url-codec', title: 'URL 编解码', description: '转换 URL 与参数中的百分号编码。', categoryId: 'encoding', keywords: ['uri', 'encode', 'decode', '网址', '百分号'], order: 50 },
  { slug: 'json', title: 'JSON 格式化', description: '校验、格式化与压缩 JSON，保留数字精度。', categoryId: 'encoding', keywords: ['format', 'minify', 'validate', '美化', '压缩'], order: 60 },
  { slug: 'text', title: '文本处理', description: '统计字数、转换大小写、去重与清理空行。', categoryId: 'text', keywords: ['word', 'count', 'case', '去重', '字数', '大小写'], order: 70 },
  { slug: 'timestamp', title: '时间戳转换', description: '秒、毫秒与日期互转，明确本地时间和 UTC。', categoryId: 'time', keywords: ['unix', 'epoch', 'date', '时间', '日期'], order: 80 },
  { slug: 'qrcode', title: '二维码生成', description: '把文字或链接制成二维码，导出 PNG 与 SVG。', categoryId: 'media', keywords: ['qr', '二维码', '链接'], order: 90 },
  { slug: 'image', title: '图片压缩与缩放', description: '调整尺寸与质量，转换 JPG、PNG 和 WebP。', categoryId: 'media', keywords: ['compress', 'resize', 'jpg', 'png', 'webp', '图片'], order: 100 },
  { slug: 'pdf2jpg', title: 'PDF 转 JPG', description: '逐页导出 JPG 并打包，或拼接为一张长图。', categoryId: 'media', keywords: ['pdf', 'jpeg', '长图', '文档', 'zip'], order: 110 },
];
export const getToolPath = (tool) => `/${tool.slug}/`;
export const getCategory = (id) => categories.find((category) => category.id === id);
export const getCategoryTools = (id) => tools.filter((tool) => tool.categoryId === id).sort((a, b) => a.order - b.order);
export function matchesSearch(tool, query) {
  const normalize = (text) => text.normalize('NFKC').toLocaleLowerCase('zh-CN');
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const haystack = normalize([tool.title, tool.description, tool.slug, ...tool.keywords].join(' '));
  return terms.every((term) => haystack.includes(term));
}
export function validateCatalog(catalog = tools, groups = categories) {
  const slugs = new Set();
  for (const tool of catalog) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tool.slug) || slugs.has(tool.slug)) throw new Error(`工具地址无效或重复：${tool.slug}`);
    if (!groups.some((group) => group.id === tool.categoryId)) throw new Error(`工具分类不存在：${tool.slug}`);
    if (!tool.title || !tool.description || !Array.isArray(tool.keywords) || !Number.isFinite(tool.order)) throw new Error(`工具元数据不完整：${tool.slug}`);
    slugs.add(tool.slug);
  }
}
