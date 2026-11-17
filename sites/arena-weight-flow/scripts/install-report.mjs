// Install only the report-mode Vite build. No hand edits to minified bundles.
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, resolve, relative } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = resolve(root, 'dist-report');
const target = resolve(root, '../../dashboards/ch1');
const entry = await readFile(join(source, 'index.html'), 'utf8');
if (!entry.includes('type="module"')) throw Error('Build report mode with Vite before installing.');
await mkdir(target, { recursive: true });
// Only assets are disposable. Keep any non-generated additions in the target.
await rm(join(target, 'assets'), { recursive: true, force: true });
await cp(source, target, { recursive: true, force: true });
await writeFile(join(target, 'index.html'), entry.replace('</head>', '<link rel="stylesheet" href="/static/chart-theme.css"><link rel="stylesheet" href="/static/embed.css"></head>').replace('</body>', '<script src="/static/embed-bridge.js"></script><script>if(new URLSearchParams(location.search).get("embed")!=="1"){const bridge=document.createElement("script");bridge.src="/static/bridge.js";document.body.append(bridge);}</script></body>'));

async function hashes(dir) {
  const files = [];
  for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await hashes(path));
    else {
      const bytes = await readFile(path);
      files.push({ path: relative(target, path).replaceAll('\\', '/'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
    }
  }
  return files;
}
const files = [...await hashes(join(target, 'assets')), ...await hashes(join(target, 'data'))];
await writeFile(join(target, 'BUILD_INFO.json'), JSON.stringify({
  source: 'sites/arena-weight-flow', command: 'npm run build:report', mode: 'report',
  renderer: 'D3 scales, stack/area/line geometry and timer/interpolation on Canvas; SVG monthly ruler',
  dashboardOnly: true, language: 'en', files,
}, null, 2) + '\n');
console.log(`Installed D3 Chapter 1 report build: ${target}`);
