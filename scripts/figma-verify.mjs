#!/usr/bin/env node
/**
 * Verify built screens against the Figma frame dimensions we have cached.
 *
 * The file-content endpoints have been rate limited, so this checks what the
 * depth-2 structure gives us: frame widths and heights. It is NOT the
 * per-element diff figma-diff.mjs does — that needs the full node tree.
 */
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(import.meta.dirname, '..');
const root = JSON.parse(await readFile(join(ROOT, '.figma-root.json'), 'utf8'));
const doc = Object.values(root.nodes)[0].document;

/** Figma page name -> built route, and the selector carrying the frame. */
const MAP = [
  ['Cart Page', '/cart/', '.fz-shell'],
  ['Payment Page', '/payment/', '.fz-shell'],
  ['Product detail (full page idli podi)', '/product/idli-podi/', '.fz-shell'],
  // Frame 596 is the dropdown itself, 384x253.
  ['Product detaails (after add to cart)', '/product/idli-podi/added/', '.fz-added', 384],
  ['Product detaails (sold out)', '/product/gongura-pickle/', '.fz-shell'],
  ['Shop listing (Podis, filters applied)', '/shop/', '.fz-shell'],
  ['Shop listing (search results)', '/shop/results/', '.fz-shell'],
  ['Shop listing (Search suggestions)', '/shop/suggestions/', '.fz-shell'],
  ['Shop listing (No results)', '/shop/no-results/', '.fz-shell'],
  ['Sign in customer 1', '/signin/customer/phone/', '.fz-auth__card'],
  ['Sign in customer 2', '/signin/customer/otp/', '.fz-auth__card'],
  ['Sign in customer 3', '/signin/customer/profile/', '.fz-auth__card'],
  ['Sign in maker 1', '/signin/maker/phone/', '.fz-auth__card'],
  ['Sign in maker 2', '/signin/maker/otp/', '.fz-auth__card'],
  ['Sign in maker 3', '/signin/maker/kitchen/', '.fz-kitchen'],
  ['Sign in maker 4', '/signin/maker/documents/', '.fz-auth__card'],
  ['Sign in maker 5', '/signin/maker/review/', '.fz-auth__card'],
  ['After tapping: the page stays behind, the panel opens in place', '/story/idli-podi/', '.fz-panel'],
  // Free-layout page with no content frame; the hero copy is 786 wide.
  ['Old website coming soon', '/coming-soon/', '.fz-soon__head', 786, 'loose'],
];

/** Widest frame on a page is the screen's own width. */
function frameWidth(page) {
  const w = (page.children || [])
    .map((c) => c.absoluteBoundingBox?.width ?? 0)
    .filter((n) => n > 0);
  return w.length ? Math.round(Math.max(...w)) : null;
}

/** The notable non-full-width frame, which is usually the content card. */
function cardWidth(page) {
  const w = (page.children || [])
    .map((c) => Math.round(c.absoluteBoundingBox?.width ?? 0))
    .filter((n) => n > 200 && n < 1400);
  return w.length ? Math.max(...w) : null;
}

const byName = new Map(doc.children.map((p) => [p.name, p]));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

let pass = 0;
const rows = [];
for (const [figmaName, route, selector, explicitWant, mode] of MAP) {
  const fig = byName.get(figmaName);
  if (!fig) { rows.push({ route, note: 'figma page not found' }); continue; }

  await page.goto(`http://localhost:4321${route}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);

  const got = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? Math.round(el.getBoundingClientRect().width) : null;
  }, selector);

  const want = explicitWant ?? (selector === '.fz-shell' ? 1200 : cardWidth(fig));
  const delta = got != null && want != null ? got - want : null;
  // A free-layout page has no frame to match exactly; allow the text block to
  // differ while still catching a wildly wrong width.
  const tolerance = mode === 'loose' ? 120 : 12;
  const ok = delta != null && Math.abs(delta) <= tolerance;
  if (ok) pass += 1;
  rows.push({ route, frame: frameWidth(fig), want, got, delta, ok });
}
await browser.close();

console.log('\nscreen'.padEnd(34) + 'frame'.padStart(7) + 'want'.padStart(7) + 'ours'.padStart(7) + '   diff');
for (const r of rows) {
  if (r.note) { console.log(r.route.padEnd(34) + '  ' + r.note); continue; }
  console.log(
    r.route.padEnd(34) +
      String(r.frame ?? '-').padStart(7) +
      String(r.want ?? '-').padStart(7) +
      String(r.got ?? '-').padStart(7) +
      '   ' + (r.delta == null ? '-' : (r.delta > 0 ? '+' : '') + r.delta) +
      (r.ok ? '  ok' : '  OFF'),
  );
}
console.log(`\n${pass}/${rows.length} within 12px`);

/*
 * Component dimensions named directly in the frames. These come from the
 * depth-2 structure, so they are frame sizes rather than per-element spacing.
 */
const COMPONENTS = [
  ['/signin/customer/phone/', '.fz-auth__aside', 555, 'brand aside'],
  ['/signin/customer/phone/', '.fz-auth__card', 557, 'form card'],
  ['/product/idli-podi/added/', '.fz-added', 384, 'cart dropdown'],
  ['/story/idli-podi/', '.fz-panel', 588, 'story panel'],
  ['/shop/', '.fz-filters', 272, 'filter sidebar'],
  ['/shop/results/', '.fz-makerchip', 205, 'maker chip'],
  ['/cart/', '.fz-shell', 1200, 'content column'],
];

const b2 = await chromium.launch();
const p2 = await b2.newPage({ viewport: { width: 1440, height: 1000 } });
let cpass = 0;
console.log('\ncomponent'.padEnd(22) + 'figma'.padStart(7) + 'ours'.padStart(7) + '   diff');
for (const [route, sel, want, label] of COMPONENTS) {
  await p2.goto(`http://localhost:4321${route}`, { waitUntil: 'networkidle' });
  await p2.waitForTimeout(300);
  const got = await p2.evaluate((s) => {
    const el = document.querySelector(s);
    return el ? Math.round(el.getBoundingClientRect().width) : null;
  }, sel);
  const delta = got == null ? null : got - want;
  const ok = delta != null && Math.abs(delta) <= 12;
  if (ok) cpass += 1;
  console.log(
    label.padEnd(22) + String(want).padStart(7) + String(got ?? '-').padStart(7) +
    '   ' + (delta == null ? '-' : (delta > 0 ? '+' : '') + delta) + (ok ? '  ok' : '  OFF'),
  );
}
await b2.close();
console.log(`\n${cpass}/${COMPONENTS.length} components within 12px`);
