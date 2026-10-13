#!/usr/bin/env node
/**
 * Diff the built page against the Figma frame, element by element.
 *
 * Matches on text content, then compares position and font size. Spot-checking
 * a dozen values is not enough: spacing is hundreds of numbers and the eye
 * notices the aggregate, not any one of them.
 */
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(import.meta.dirname, '..');
const frames = JSON.parse(await readFile(join(ROOT, '.figma-frames.json'), 'utf8'));
const which = process.argv[2] === 'mobile' ? 'mobile' : 'web';
const root = frames[which];
const ox = root.absoluteBoundingBox.x;
const oy = root.absoluteBoundingBox.y;

const figma = [];
(function walk(n) {
  if (n.type === 'TEXT' && n.characters?.trim()) {
    const b = n.absoluteBoundingBox;
    if (b) {
      figma.push({
        text: n.characters.trim().replace(/\s+/g, ' '),
        x: Math.round(b.x - ox),
        y: Math.round(b.y - oy),
        size: Math.round(n.style?.fontSize ?? 0),
        family: n.style?.fontFamily ?? '',
      });
    }
  }
  (n.children || []).forEach(walk);
})(root);

const width = which === 'mobile' ? 402 : 1440;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 1200 } });
await page.goto(`http://localhost:4321/fz/`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(900);

const dom = await page.evaluate(() => {
  const out = [];
  const walk = (el) => {
    for (const node of el.childNodes) {
      if (node.nodeType === 3 && node.textContent.trim()) {
        const r = document.createRange();
        r.selectNodeContents(node);
        const b = r.getBoundingClientRect();
        if (b.width || b.height) {
          const cs = getComputedStyle(node.parentElement);
          out.push({
            text: node.textContent.trim().replace(/\s+/g, ' '),
            x: Math.round(b.x + scrollX),
            y: Math.round(b.y + scrollY),
            size: Math.round(parseFloat(cs.fontSize)),
            family: cs.fontFamily.split(',')[0].replace(/["']/g, ''),
          });
        }
      } else if (node.nodeType === 1) walk(node);
    }
  };
  walk(document.body);
  return out;
});
await browser.close();

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9₹]/g, '').slice(0, 28);
const used = new Set();
const rows = [];
for (const f of figma) {
  const key = norm(f.text);
  if (key.length < 4) continue;
  const i = dom.findIndex((d, idx) => !used.has(idx) && norm(d.text) === key);
  if (i === -1) {
    rows.push({ text: f.text.slice(0, 30), status: 'MISSING' });
    continue;
  }
  used.add(i);
  const d = dom[i];
  rows.push({
    text: f.text.slice(0, 30),
    dx: d.x - f.x,
    dy: d.y - f.y,
    dsize: d.size - f.size,
    famOk: d.family === f.family,
  });
}

const matched = rows.filter((r) => r.status !== 'MISSING');
const missing = rows.filter((r) => r.status === 'MISSING');
const badSize = matched.filter((r) => r.dsize !== 0);
const badFam = matched.filter((r) => !r.famOk);
const offX = matched.filter((r) => Math.abs(r.dx) > 8);

console.log(`\n${which.toUpperCase()}  figma texts=${figma.length}  matched=${matched.length}  missing=${missing.length}`);
console.log(`font-size mismatches : ${badSize.length}`);
console.log(`font-family mismatches: ${badFam.length}`);
console.log(`x off by >8px        : ${offX.length}`);

if (badSize.length) {
  console.log('\n-- wrong font size (figma -> ours) --');
  for (const r of badSize.slice(0, 18))
    console.log(`  ${String(r.text).padEnd(32)} ${r.dsize > 0 ? '+' : ''}${r.dsize}px`);
}
if (badFam.length) {
  console.log('\n-- wrong font family --');
  for (const r of badFam.slice(0, 16)) console.log(`  ${String(r.text).padEnd(32)}`);
}
if (offX.length) {
  console.log('\n-- horizontal drift --');
  for (const r of offX.slice(0, 14))
    console.log(`  ${String(r.text).padEnd(32)} dx=${r.dx > 0 ? '+' : ''}${r.dx}`);
}
