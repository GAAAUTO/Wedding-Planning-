import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.standalone-build');
await build({
  configFile: false, root, base: './', plugins: [react()], publicDir: false,
  build: { outDir, emptyOutDir: true, assetsInlineLimit: () => true, cssCodeSplit: false, chunkSizeWarningLimit: 2500, rollupOptions: { output: { inlineDynamicImports: true } } },
});
let html = await readFile(path.join(outDir, 'index.html'), 'utf8');
const scriptTag = html.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/);
if (!scriptTag) throw new Error('Built JavaScript entry was not found.');
const js = await readFile(path.resolve(outDir, scriptTag[1]), 'utf8');
html = html.replace(scriptTag[0], () => `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`);
const cssTag = html.match(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/);
if (!cssTag) throw new Error('Built stylesheet was not found.');
const css = await readFile(path.resolve(outDir, cssTag[1]), 'utf8');
html = html.replace(cssTag[0], () => `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`);
const favicon = await readFile(path.join(root, 'public/favicon.svg'), 'utf8');
html = html.replace('href="/favicon.svg"', `href="data:image/svg+xml,${encodeURIComponent(favicon)}"`);
const output = path.join(root, 'standalone');
await mkdir(output, { recursive: true });
await writeFile(path.join(output, 'Ever-After-Events.html'), html);
await rm(outDir, { recursive: true, force: true });
console.log(`Standalone website: ${path.join(output, 'Ever-After-Events.html')} (${(Buffer.byteLength(html)/1024/1024).toFixed(2)} MB)`);
