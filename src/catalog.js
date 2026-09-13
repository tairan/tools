export const tools = [
  {
    slug: 'pdf2jpg',
    title: 'PDF 转 JPG',
    description: '在浏览器本地将 PDF 转为 JPG，逐页打包下载，或拼接为一张长图。',
  },
];

export function getToolPath(tool) {
  return `/${tool.slug}/`;
}
