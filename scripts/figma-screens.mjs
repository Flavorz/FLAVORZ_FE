#!/usr/bin/env node
/**
 * Render every page's top-level frames to PNG for reference.
 *
 * The images endpoint is a different rate-limit bucket from the full-file
 * read, which has been throttled for most of this project.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ROOT = resolve(import.meta.dirname, '..');
const env = Object.fromEntries(
  (await readFile(join(ROOT, '.env'), 'utf8')).split('\n')
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)).filter(Boolean)
    .map((m) => [m[1], m[2].replace(/^["']|["']$/g, '')]),
);
const H = { 'X-Figma-Token': env.FIGMA_TOKEN };
const root = JSON.parse(await readFile(join(ROOT, '.figma-root.json'), 'utf8'));
const doc = Object.values(root.nodes)[0].document;

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const only = process.argv[2];

for (const page of doc.children) {
  if (only && !page.name.toLowerCase().includes(only.toLowerCase())) continue;
  // Render the PAGE itself, not its frames: a page's frames are the pieces
  // of one screen, and rendering them separately loses the composition.
  const ids = [page.id];

  const url = `https://api.figma.com/v1/images/${env.FIGMA_FILE_KEY}?ids=${encodeURIComponent(ids.join(','))}&format=png&scale=0.5`;
  // Figma throttles bursts; back off and retry rather than losing the page.
  let res;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    res = await fetch(url, { headers: H });
    if (res.ok) break;
    if (res.status !== 429) break;
    await sleep(attempt * 15000);
  }
  if (!res.ok) { console.error(`${page.name}: HTTP ${res.status}`); continue; }
  const { images, err } = await res.json();
  if (err) { console.error(`${page.name}: ${err}`); continue; }

  let n = 0;
  for (const [id, link] of Object.entries(images)) {
    if (!link) continue;
    const buf = Buffer.from(await (await fetch(link)).arrayBuffer());
    const name = `${slug(page.name)}${Object.keys(images).length > 1 ? `-${++n}` : ''}.png`;
    await writeFile(join(ROOT, 'design/figma/screens', name), buf);
  }
  console.log(`${page.name} -> ok`);
  await sleep(2500);
}
