#!/usr/bin/env node
/**
 * Cache every page's node tree, waiting out Figma's rate limit.
 *
 * Self-contained and idempotent: already-cached pages are skipped, so this can
 * be re-run after an interruption without refetching.
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ROOT = resolve(import.meta.dirname, '..');
const env = Object.fromEntries(
  (await readFile(join(ROOT, '.env'), 'utf8')).split('\n')
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)).filter(Boolean)
    .map((m) => [m[1], m[2].replace(/^["']|["']$/g, '')]),
);
const H = { 'X-Figma-Token': env.FIGMA_TOKEN };
const OUT = join(ROOT, '.figma-pages');
await mkdir(OUT, { recursive: true });

const root = JSON.parse(await readFile(join(ROOT, '.figma-root.json'), 'utf8'));
const doc = Object.values(root.nodes)[0].document;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

for (const page of doc.children) {
  const name = slug(page.name);
  const file = join(OUT, `${name}.json`);
  if (existsSync(file)) { console.log(`skip ${name}`); continue; }

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const res = await fetch(
      `https://api.figma.com/v1/files/${env.FIGMA_FILE_KEY}/nodes?ids=${encodeURIComponent(page.id)}`,
      { headers: H },
    );
    if (res.ok) {
      await writeFile(file, JSON.stringify(await res.json()), 'utf8');
      console.log(`cached ${name}`);
      break;
    }
    if (res.status !== 429) { console.error(`${name}: HTTP ${res.status}`); break; }
    await sleep(60_000);
  }
  await sleep(5_000);
}
console.log('done');
