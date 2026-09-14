import { makeZip, downloadBlob } from '../../shared/io.js';
export async function downloadAsZip(pages, baseName = 'converted') {
  const zip = await makeZip(pages.map(({ pageNum, blob }) => ({ name: `page-${String(pageNum).padStart(3, '0')}.jpg`, blob })));
  downloadBlob(zip, `${baseName}.zip`);
}
