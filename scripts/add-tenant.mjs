#!/usr/bin/env node
/**
 * Scaffold a new tenant.
 *
 *   node scripts/add-tenant.mjs --id acme --name "Acme" \
 *     --host acme.example.com --accent "#6B4EFF"
 *
 * Writes config/tenants/<id>.json, then compiles that tenant's theme. The app
 * itself is NOT rebuilt: onboarding a brand produces one CSS file to upload.
 */
import { execFile } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const ROOT = resolve(import.meta.dirname, '..');

function arg(flag, fallback = null) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? fallback : (process.argv[i + 1] ?? fallback);
}

const id = arg('--id');
const name = arg('--name');
const host = arg('--host');
const accent = arg('--accent');
const neutralStyle = arg('--neutral-style', 'neutral');
const radius = arg('--radius', 'soft');

if (!id || !name || !host || !accent) {
  console.error(
    'usage: add-tenant.mjs --id <slug> --name <Name> --host <hostname> --accent <#hex>\n' +
      '       [--neutral-style warm|cool|neutral] [--radius sharp|soft|round]',
  );
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(id)) {
  console.error(`error: --id must be lowercase kebab-case (got "${id}")`);
  process.exit(1);
}
if (!/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(accent)) {
  console.error(`error: --accent must be a hex color (got "${accent}")`);
  process.exit(1);
}

const file = join(ROOT, 'config/tenants', `${id}.json`);
if (existsSync(file)) {
  console.error(`error: ${file} already exists`);
  process.exit(1);
}

const config = {
  id,
  name,
  hosts: [host],
  theme: { accent, neutralStyle, contrast: 'standard', radius, tokens: {} },
  assets: { logo: `/brands/${id}/logo.svg`, favicon: `/brands/${id}/favicon.svg` },
  copy: {},
  runtime: {},
};

await writeFile(file, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
console.log(`[tenant] wrote ${file}`);

await mkdir(join(ROOT, 'public/brands', id), { recursive: true });
console.log(`[tenant] created public/brands/${id}/ — add logo.svg and favicon.svg`);

await run('node', ['scripts/build-tenant-themes.mjs', '--only', id], { cwd: ROOT });
console.log(`[tenant] built theme for ${id}`);
console.log(`\nNext: upload public/themes/${id}.css and point ${host} at the distribution.`);
