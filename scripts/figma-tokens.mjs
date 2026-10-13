#!/usr/bin/env node
/**
 * Pull the Dev Flavorz colour + text styles and emit a tenant theme patch.
 *
 * Separate from figma-pull.mjs (which only guesses an accent) because this
 * file has a real naming system — Primary Button/, Accent Panel/, General &
 * Text/ — worth mapping deliberately rather than heuristically.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
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

/**
 * Cache the file response. Figma rate-limits repeated full-file reads, and a
 * throttled response comes back without `document`, which looked like a code
 * bug the first time it happened.
 */
const CACHE = join(ROOT, '.figma-cache.json');
let file;
if (!process.argv.includes('--refresh') && existsSync(CACHE)) {
  file = JSON.parse(await readFile(CACHE, 'utf8'));
} else {
  const res = await fetch(`https://api.figma.com/v1/files/${env.FIGMA_FILE_KEY}`, { headers: H });
  if (!res.ok) {
    console.error(`Figma ${res.status}: ${(await res.text()).slice(0, 160)}`);
    process.exit(1);
  }
  file = await res.json();
  await writeFile(CACHE, JSON.stringify(file), 'utf8');
}
if (!file?.document) {
  console.error('Figma returned no document (likely rate-limited). Retry with --refresh.');
  process.exit(1);
}

const toHex = ({ r, g, b }) =>
  '#' + [r, g, b].map((n) => Math.round(n * 255).toString(16).padStart(2, '0')).join('');

const fills = new Map();
const texts = new Map();
(function walk(n) {
  if (n.styles?.fill && n.fills?.length) {
    const s = n.fills.find((f) => f.type === 'SOLID' && f.visible !== false);
    if (s) fills.set(n.styles.fill, toHex(s.color));
  }
  if (n.styles?.text && n.style) texts.set(n.styles.text, n.style);
  (n.children || []).forEach(walk);
})(file.document);

const byName = {};
for (const [id, s] of Object.entries(file.styles)) {
  if (s.styleType === 'FILL' && fills.has(id)) byName[s.name] = fills.get(id);
  if (s.styleType === 'TEXT' && texts.has(id)) byName[`TEXT:${s.name}`] = texts.get(id);
}

const pick = (...names) => {
  for (const n of names) if (byName[n]) return byName[n];
  return undefined;
};

// Map Figma's names onto Astryx's semantic tokens. Dark values are derived
// where the design has no dark mode: the file is light-only today.
const theme = {
  accent: pick('Primary button', 'Primary Button/Fill'),
  onAccent: pick('Primary button fill text', 'Primary Button/Text'),
  textPrimary: pick('General & Text/Black Text'),
  subheading: pick('General & Text/Subheading'),
  siteBg: pick('General & Text/Site bg & White text'),
  panelFill: pick('Accent Panel/Fill'),
  panelText: pick('Accent Panel/Text, Icon'),
  panelFooter: pick('Accent Panel/Footer fill'),
  secondary: pick('Secondary button', 'Secondary Button/Fill'),
  onSecondary: pick('Secondary button fill text', 'Secondary Button/Text'),
  tagFill: pick('Tag/Fill'),
  tagText: pick('Tag/Text'),
  hover: pick('Primary hover button'),
  disabled: pick('Primary disabled button'),
};

const body = byName['TEXT:Body text'];
const h1 = byName['TEXT:H1'];
const para = byName['TEXT:Para text'];

console.log('=== mapped colours ===');
for (const [k, v] of Object.entries(theme)) console.log(`  ${k.padEnd(14)} ${v ?? '(not found)'}`);
console.log('\n=== type ===');
console.log(`  body     ${body?.fontFamily} ${body?.fontSize}px`);
console.log(`  heading  ${h1?.fontFamily} ${h1?.fontSize}px`);
console.log(`  para     ${para?.fontFamily} ${para?.fontSize}px`);

if (process.argv.includes('--write')) {
  const path = join(ROOT, 'config/tenants/flavorz.json');
  const tenant = JSON.parse(await readFile(path, 'utf8'));

  tenant.name = 'Flavorz';
  tenant.theme.accent = [theme.accent, '#D9C6CC'];
  tenant.theme.neutralStyle = 'warm';
  tenant.theme.contrast = 'standard';
  tenant.theme.radius = { base: 4, multiplier: 1.5 };
  tenant.theme.typography = {
    scale: { base: Math.round(para?.fontSize ?? 16), ratio: 1.25 },
    body: {
      family: 'DM Sans',
      fallbacks: '-apple-system, system-ui, sans-serif',
      source: { type: 'google', axes: 'wght@400;500;600;700' },
    },
    heading: {
      family: 'DM Serif Display',
      fallbacks: 'Georgia, serif',
      weight: 'normal',
      source: { type: 'google', axes: 'wght@400' },
    },
  };
  // Tokens the generative axis does not derive — taken straight from Figma.
  tenant.theme.tokens = {
    '--color-on-accent': [theme.onAccent, '#2A2328'],
    '--color-text-primary': [theme.textPrimary, '#F1F0F1'],
    '--color-text-secondary': [theme.subheading, '#A9A4A6'],
    '--color-background-body': [theme.siteBg, '#1A1518'],
    '--color-background-surface': [theme.siteBg, '#231D21'],
    '--color-background-muted': [theme.panelFill, '#2A2328'],
  };
  tenant.copy = {
    'hero.title': 'Food with a face behind it',
    'hero.subtitle': '100% of the price goes to the maker.',
    'nav.cta': 'Shop',
  };
  await writeFile(path, `${JSON.stringify(tenant, null, 2)}\n`, 'utf8');
  console.log(`\nWrote ${path}`);
}
