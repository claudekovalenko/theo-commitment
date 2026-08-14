// Builds dist/good-ground.html — the whole app as one self-contained file, for
// hosts that can only serve a single page. The multi-file version in the repo
// root is the real one: it keeps the service worker, so it works offline.
//
//   npx esbuild@0.24.0 --version   # any recent esbuild is fine
//   node tools/build_single.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (p) => readFile(join(ROOT, p), 'utf8');
const dataUri = async (p, type) => `data:${type};base64,${(await readFile(join(ROOT, p))).toString('base64')}`;

const js = execFileSync('npx', ['--yes', 'esbuild@0.24.0', 'js/app.js', '--bundle', '--format=iife'],
  { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 24 });

const css = await read('styles.css');
let html = await read('index.html');

// The strict CSP and the external files only make sense in the multi-file build.
html = html
  .replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>/, '')
  .replace(/\s*<link rel="manifest"[^>]*>/, '')
  .replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`)
  .replace('<script type="module" src="js/app.js"></script>', `<script>\n${js}\n</script>`)
  .replace('href="icons/favicon-32.png"', `href="${await dataUri('icons/favicon-32.png', 'image/png')}"`)
  .replace('href="icons/apple-touch-icon.png"', `href="${await dataUri('icons/apple-touch-icon.png', 'image/png')}"`);

await mkdir(join(ROOT, 'dist'), { recursive: true });
await writeFile(join(ROOT, 'dist/good-ground.html'), html);
console.log(`dist/good-ground.html — ${(html.length / 1024).toFixed(0)} KB`);
