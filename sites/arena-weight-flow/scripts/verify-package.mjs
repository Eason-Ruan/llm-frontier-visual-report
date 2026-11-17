import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('PACKAGE_MANIFEST.json', root)));
for (const entry of manifest.files) {
  if (entry.path.startsWith('/') || entry.path.split('/').includes('..')) throw Error(`Invalid path: ${entry.path}`);
  const bytes = readFileSync(new URL(entry.path, root));
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (bytes.length !== entry.bytes || hash !== entry.sha256) throw Error(`Checksum mismatch: ${entry.path}`);
}
console.log(`Verified ${manifest.files.length} package files (size + SHA-256).`);
