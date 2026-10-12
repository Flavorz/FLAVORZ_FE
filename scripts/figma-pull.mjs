#!/usr/bin/env node
/**
 * Pull design tokens out of a Figma file and map them onto a tenant config.
 *
 * Two sources, tried in order:
 *
 *   1. Variables  — GET /v1/files/:key/variables/local
 *                   The modern, correct source: typed variables with modes,
 *                   so Light/Dark map straight onto our [light, dark] pairs.
 *                   NOTE: this endpoint is gated to Figma Org/Enterprise
 *                   plans. On Professional it returns 403.
 *
 *   2. Styles     — GET /v1/files/:key  (published colour + text styles)
 *                   Works on every plan. Less structured: no modes, so dark
 *                   values have to be named or inferred.
 *
 * Usage:
 *   node scripts/figma-pull.mjs --inspect            report what the file has
 *   node scripts/figma-pull.mjs --tenant flavorz     write the tenant's theme
 *   node scripts/figma-pull.mjs --tenant acme --dry  print, do not write
 *
 * Credentials come from .env (FIGMA_TOKEN, FIGMA_FILE_KEY) — never from argv,
 * so the token cannot land in shell history.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const API = 'https://api.figma.com';

/** Minimal .env reader — avoids a dependency for three variables. */
async function loadEnv() {
  const path = join(ROOT, '.env');
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of (await readFile(path, 'utf8')).split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let [, k, v] = m;
    v = v.replace(/^["']|["']$/g, '');
    if (v) out[k] = v;
  }
  return out;
}

function arg(flag, fallback = null) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  return next && !next.startsWith('--') ? next : true;
}

async function figma(path, token) {
  const res = await fetch(`${API}${path}`, { headers: { 'X-Figma-Token': token } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`Figma ${res.status} on ${path}: ${body.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/** Figma colours are 0..1 floats. */
function toHex({ r, g, b, a = 1 }) {
  const c = (n) =>
    Math.round(Math.max(0, Math.min(1, n)) * 255)
      .toString(16)
      .padStart(2, '0');
  const base = `#${c(r)}${c(g)}${c(b)}`;
  return a < 1 ? `${base}${c(a)}` : base;
}

/** Which mode name looks like dark? */
function isDarkMode(name) {
  return /dark|night/i.test(name);
}

/**
 * Score a variable name for how likely it is to be the brand accent.
 * Figma files name this wildly differently, so prefer explicit matches.
 */
function accentScore(name) {
  const n = name.toLowerCase();
  if (/\b(accent|brand|primary)\b/.test(n)) return 3;
  if (/accent|brand|primary/.test(n)) return 2;
  if (/\b(main|key)\b/.test(n)) return 1;
  return 0;
}

async function pullVariables(token, fileKey) {
  const data = await figma(`/v1/files/${fileKey}/variables/local`, token);
  const collections = Object.values(data.meta?.variableCollections ?? {});
  const variables = Object.values(data.meta?.variables ?? {});

  const colors = [];
  for (const v of variables) {
    if (v.resolvedType !== 'COLOR') continue;
    const collection = collections.find((c) => c.id === v.variableCollectionId);
    if (!collection) continue;

    const byMode = {};
    for (const mode of collection.modes) {
      const raw = v.valuesByMode?.[mode.modeId];
      // Aliases point at another variable; we only take literal colours.
      if (raw && typeof raw === 'object' && 'r' in raw) {
        byMode[mode.name] = toHex(raw);
      }
    }
    if (Object.keys(byMode).length > 0) {
      colors.push({ name: v.name, collection: collection.name, byMode });
    }
  }

  return { type: 'variables', colors, collections: collections.map((c) => c.name) };
}

async function pullStyles(token, fileKey) {
  const file = await figma(`/v1/files/${fileKey}`, token);
  const styles = Object.entries(file.styles ?? {}).map(([id, s]) => ({ id, ...s }));

  // Style definitions live on nodes; walk the tree to resolve fills.
  const found = new Map();
  const walk = (node) => {
    if (node.styles?.fill && node.fills?.length) {
      const solid = node.fills.find((f) => f.type === 'SOLID' && f.visible !== false);
      if (solid) found.set(node.styles.fill, toHex({ ...solid.color, a: solid.opacity ?? 1 }));
    }
    for (const child of node.children ?? []) walk(child);
  };
  walk(file.document);

  const colors = styles
    .filter((s) => s.styleType === 'FILL' && found.has(s.id))
    .map((s) => ({ name: s.name, collection: 'styles', byMode: { Default: found.get(s.id) } }));

  return { type: 'styles', colors, collections: ['styles'] };
}

function report(result) {
  console.log(`\nSource: ${result.type}`);
  console.log(`Collections: ${result.collections.join(', ') || '(none)'}`);
  console.log(`Colour tokens found: ${result.colors.length}\n`);

  const ranked = [...result.colors].sort((a, b) => accentScore(b.name) - accentScore(a.name));
  console.log('Top candidates for the brand accent:');
  for (const c of ranked.slice(0, 8)) {
    const modes = Object.entries(c.byMode)
      .map(([m, v]) => `${m}=${v}`)
      .join('  ');
    console.log(`  ${accentScore(c.name) > 0 ? '*' : ' '} ${c.name.padEnd(36)} ${modes}`);
  }
  console.log('\n(* = name matches accent/brand/primary)');
}

/** Map the pulled colours onto our tenant theme shape. */
function toTheme(result) {
  const ranked = [...result.colors].sort((a, b) => accentScore(b.name) - accentScore(a.name));
  const best = ranked[0];
  if (!best || accentScore(best.name) === 0) {
    throw new Error(
      'No variable looked like a brand accent. Rename one to include ' +
        '"accent", "brand" or "primary", or pass --accent-name "<exact name>".',
    );
  }

  const named = arg('--accent-name');
  const chosen =
    typeof named === 'string' ? result.colors.find((c) => c.name === named) || best : best;

  const modes = Object.entries(chosen.byMode);
  const dark = modes.find(([m]) => isDarkMode(m));
  const light = modes.find(([m]) => !isDarkMode(m)) ?? modes[0];

  const accent = dark && light ? [light[1], dark[1]] : (light?.[1] ?? modes[0][1]);

  return { accent, source: chosen.name, modes: modes.map(([m]) => m) };
}

async function main() {
  const env = await loadEnv();
  const token = env.FIGMA_TOKEN;
  const fileKey = arg('--file', env.FIGMA_FILE_KEY);

  if (!token || !fileKey) {
    console.error(
      'Missing credentials.\n\n' +
        '  1. cp .env.example .env\n' +
        '  2. Put FIGMA_TOKEN and FIGMA_FILE_KEY in .env\n' +
        '     (Figma → Settings → Security → Personal access tokens)\n\n' +
        '.env is gitignored — do not commit it or paste the token anywhere.',
    );
    return 1;
  }

  let result;
  try {
    result = await pullVariables(token, fileKey);
    if (result.colors.length === 0) {
      console.log('No colour variables found; falling back to published styles.');
      result = await pullStyles(token, fileKey);
    }
  } catch (err) {
    if (err.status === 403) {
      console.log(
        'Variables endpoint returned 403 — this usually means the file is not on a\n' +
          'Figma Org/Enterprise plan, or the token lacks file_variables:read.\n' +
          'Falling back to published styles.\n',
      );
      result = await pullStyles(token, fileKey);
    } else if (err.status === 404) {
      console.error(`File "${fileKey}" not found, or the token cannot read it.`);
      return 1;
    } else if (err.status === 403 || err.status === 401) {
      console.error('Figma rejected the token. Check FIGMA_TOKEN and its scopes.');
      return 1;
    } else {
      throw err;
    }
  }

  if (result.colors.length === 0) {
    console.error('No colour variables or styles found in that file.');
    return 1;
  }

  if (arg('--inspect')) {
    report(result);
    return 0;
  }

  const tenantId = arg('--tenant');
  if (typeof tenantId !== 'string') {
    report(result);
    console.log('\nTo write these into a tenant: --tenant <id>');
    return 0;
  }

  const mapped = toTheme(result);
  console.log(`Accent from "${mapped.source}" (modes: ${mapped.modes.join(', ')})`);
  console.log(`  → ${JSON.stringify(mapped.accent)}`);

  const file = join(ROOT, 'config/tenants', `${tenantId}.json`);
  if (!existsSync(file)) {
    console.error(`\nNo tenant at ${file}. Create it first with scripts/add-tenant.mjs.`);
    return 1;
  }

  const tenant = JSON.parse(await readFile(file, 'utf8'));
  const before = JSON.stringify(tenant.theme.accent);
  tenant.theme.accent = mapped.accent;

  if (arg('--dry')) {
    console.log(`\n[dry run] ${tenantId}.theme.accent: ${before} → ${JSON.stringify(mapped.accent)}`);
    return 0;
  }

  await writeFile(file, `${JSON.stringify(tenant, null, 2)}\n`, 'utf8');
  console.log(`\nUpdated ${file}`);
  console.log('Next: pnpm run theme:build');
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error('figma-pull failed:', err.message);
    process.exit(1);
  },
);
