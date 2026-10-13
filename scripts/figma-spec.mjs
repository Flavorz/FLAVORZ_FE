#!/usr/bin/env node
/**
 * Pull exact layout values for the web and mobile home frames.
 *
 * Uses /nodes rather than the full-file read: different rate-limit bucket, and
 * the full read has been throttled for hours.
 *
 * Prints each auto-layout frame's padding, itemSpacing, size and radius, so the
 * build can use the design's real numbers instead of measurements off a render.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const env = Object.fromEntries(
  (await readFile(join(ROOT, '.env'), 'utf8'))
    .split('\n')
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].replace(/^["']|["']$/g, '')]),
);

const H = { 'X-Figma-Token': env.FIGMA_TOKEN };
const FRAMES = { web: '1:116', mobile: '28:30' };

const out = {};
for (const [label, id] of Object.entries(FRAMES)) {
  const res = await fetch(
    `https://api.figma.com/v1/files/${env.FIGMA_FILE_KEY}/nodes?ids=${encodeURIComponent(id)}`,
    { headers: H },
  );
  if (!res.ok) {
    console.error(`${label}: HTTP ${res.status}`);
    process.exit(1);
  }
  const json = await res.json();
  out[label] = Object.values(json.nodes)[0]?.document ?? null;
  console.error(`${label}: ok`);
}

await writeFile(join(ROOT, '.figma-frames.json'), JSON.stringify(out), 'utf8');
console.error('wrote .figma-frames.json');
