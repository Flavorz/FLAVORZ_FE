#!/usr/bin/env node
/**
 * Poll Figma until the full-file rate limit clears, then cache the file.
 *
 * Self-contained on purpose: an earlier version depended on a scratch script
 * that got cleaned up mid-run, so every attempt failed silently and the poller
 * exited 0 having done nothing.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ROOT = resolve(import.meta.dirname, '..');
const env = Object.fromEntries(
  (await readFile(join(ROOT, '.env'), 'utf8'))
    .split('\n')
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].replace(/^["']|["']$/g, '')]),
);

const MINUTES = Number(process.argv[2] ?? 90);
const deadline = Date.now() + MINUTES * 60_000;

for (let attempt = 1; Date.now() < deadline; attempt += 1) {
  const res = await fetch(`https://api.figma.com/v1/files/${env.FIGMA_FILE_KEY}`, {
    headers: { 'X-Figma-Token': env.FIGMA_TOKEN },
  });
  if (res.ok) {
    await writeFile(join(ROOT, '.figma-cache.json'), JSON.stringify(await res.json()), 'utf8');
    console.log(`cached on attempt ${attempt}`);
    process.exit(0);
  }
  console.log(`attempt ${attempt}: HTTP ${res.status}`);
  await sleep(120_000);
}
console.log('still rate limited');
process.exit(1);
