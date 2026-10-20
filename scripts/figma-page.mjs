#!/usr/bin/env node
/**
 * Fetch one page's full node tree and cache it.
 * Usage: node scripts/figma-page.mjs <pageId> <slug>
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const env = Object.fromEntries(
  (await readFile(join(ROOT, '.env'), 'utf8')).split('\n')
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)).filter(Boolean)
    .map((m) => [m[1], m[2].replace(/^["']|["']$/g, '')]),
);
const [id, slug] = process.argv.slice(2);
const res = await fetch(
  `https://api.figma.com/v1/files/${env.FIGMA_FILE_KEY}/nodes?ids=${encodeURIComponent(id)}`,
  { headers: { 'X-Figma-Token': env.FIGMA_TOKEN } },
);
if (!res.ok) { console.error(`HTTP ${res.status}`); process.exit(1); }
const json = await res.json();
await mkdir(join(ROOT, '.figma-pages'), { recursive: true });
await writeFile(join(ROOT, '.figma-pages', `${slug}.json`), JSON.stringify(json), 'utf8');
console.log(`cached ${slug}`);
