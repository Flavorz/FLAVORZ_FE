#!/usr/bin/env node
/**
 * Compile every tenant's brand config into a standalone Astryx theme CSS file.
 *
 * Why this exists
 * ---------------
 * Astryx recommends BUILT themes for production: pre-compiled CSS, no flash of
 * unstyled component overrides on hydration. But a white-label product must be
 * able to onboard a brand without rebuilding the app.
 *
 * This script is the seam. The app bundle is built once and shared by every
 * tenant; each tenant's *theme* is a separate ~small CSS file compiled from its
 * JSON. Onboarding a brand runs this script (seconds) and uploads one file —
 * it does not rebuild or redeploy the app.
 *
 * Input:  config/tenants/*.json        (or --from <dir>)
 * Output: src/generated/themes/<id>.{css,js,d.ts}  — bundled, so islands can
 *         import the tenant's DefinedTheme object
 *         public/themes/<id>.css                   — served, linked by <head>
 *
 * Both locations are outside dist/, which `astro build` wipes.
 *
 * Flags:
 *   --check        verify committed output is current; non-zero if stale (CI)
 *   --only <id>    build a single tenant (onboarding one brand)
 *   --from <dir>   read tenant JSON from somewhere else (e.g. fetched from API)
 *   --out <dir>    write CSS somewhere else
 */

import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const ROOT = resolve(import.meta.dirname, '..');

function parseArgs(argv) {
  const args = { check: false, only: null, from: null, out: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--check') args.check = true;
    else if (a === '--only') args.only = argv[++i] ?? null;
    else if (a === '--from') args.from = argv[++i] ?? null;
    else if (a === '--out') args.out = argv[++i] ?? null;
    else if (a === '--help' || a === '-h') args.help = true;
    else throw new Error(`unknown argument: ${a}`);
  }
  return args;
}

/**
 * Radius presets map a brand-friendly word onto Astryx's radius scale config
 * (`base` px unit, `multiplier` scaling every step). 0 = brutalist/square,
 * 2 = very soft.
 */
const RADIUS_PRESETS = {
  sharp: { base: 4, multiplier: 0.25 },
  soft: { base: 4, multiplier: 1 },
  round: { base: 4, multiplier: 2 },
};

/**
 * Render a tenant config as Astryx theme source.
 *
 * `extends: neutralTheme` inherits the base design decisions, then the brand's
 * accent seed regenerates the ramp. Per the Astryx template: the scale configs
 * REPLACE the base's rather than merging, because they are generator inputs.
 */
function renderThemeSource(tenant) {
  const { id, theme } = tenant;
  const extraTokens = { ...(theme.tokens ?? {}) };

  const tokenLines = Object.entries(extraTokens)
    .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join('\n');

  // `color` is the supported generative axis: one accent seed expands into the
  // neutral ramp, surfaces, text, icons, borders and overlays for both modes,
  // holding >= 4.5:1 for generated text. (`colorScale` is NOT a valid key —
  // defineTheme ignores unknown keys silently and you get the default palette.)
  const colorAxis = {
    accent: theme.accent,
    neutralStyle: theme.neutralStyle ?? 'neutral',
    contrast: theme.contrast ?? 'standard',
  };

  const radius = theme.radius ? RADIUS_PRESETS[theme.radius] : null;

  return `// @generated from config/tenants/${id}.json by scripts/build-tenant-themes.mjs
// Do not edit. Change the tenant JSON (or its backend record) and rebuild.
import {defineTheme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral';

export const ${toIdent(id)}Theme = defineTheme({
  name: ${JSON.stringify(id)},
  extends: neutralTheme,
  color: ${JSON.stringify(colorAxis)},${radius ? `\n  radius: ${JSON.stringify(radius)},` : ''}
  tokens: {
${tokenLines}
  },
});

export default ${toIdent(id)}Theme;
`;
}

function toIdent(id) {
  return id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

async function readTenants(dir) {
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  const tenants = [];
  for (const file of files) {
    const raw = await readFile(join(dir, file), 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(`${file}: invalid JSON — ${err.message}`);
    }
    if (!parsed?.id) throw new Error(`${file}: missing "id"`);
    if (parsed.id !== basename(file, '.json')) {
      throw new Error(`${file}: id "${parsed.id}" must match the filename`);
    }
    tenants.push(parsed);
  }
  return tenants;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      'Usage: node scripts/build-tenant-themes.mjs [--check] [--only <id>] [--from <dir>] [--out <dir>]',
    );
    return 0;
  }

  const srcDir = resolve(ROOT, args.from ?? 'config/tenants');
  const outDir = resolve(ROOT, args.out ?? 'src/generated/themes');
  // The browser needs the CSS at a stable URL; public/ is copied into dist/.
  const publicDir = resolve(ROOT, args.out ? join(args.out, '..', 'public-themes') : 'public/themes');

  if (!existsSync(srcDir)) {
    console.error(`[themes] no tenant directory at ${srcDir}`);
    return 1;
  }

  let tenants = await readTenants(srcDir);
  if (args.only) {
    tenants = tenants.filter((t) => t.id === args.only);
    if (tenants.length === 0) {
      console.error(`[themes] no tenant with id "${args.only}" in ${srcDir}`);
      return 1;
    }
  }
  if (tenants.length === 0) {
    console.error(`[themes] no tenant JSON found in ${srcDir}`);
    return 1;
  }

  await mkdir(outDir, { recursive: true });
  await mkdir(publicDir, { recursive: true });
  // Staging must live inside the project: the generated theme source imports
  // @astryxdesign/* and Node resolves that by walking up to ./node_modules.
  // A path in the OS temp dir cannot see the project's dependencies.
  await mkdir(join(ROOT, '.astryx-staging'), { recursive: true });
  const staging = await mkdtemp(join(ROOT, '.astryx-staging', 'build-'));
  let failures = 0;

  try {
    for (const tenant of tenants) {
      const srcFile = join(staging, `${tenant.id}.mjs`);
      await writeFile(srcFile, renderThemeSource(tenant), 'utf8');

      const outFile = join(outDir, `${tenant.id}.css`);
      const cliArgs = ['astryx', 'theme', 'build', srcFile, '--out', outFile];
      if (args.check) cliArgs.push('--check');

      try {
        await run('pnpm', ['exec', ...cliArgs], { cwd: ROOT });
        if (!args.check) {
          await copyFile(outFile, join(publicDir, `${tenant.id}.css`));
        }
        console.log(`[themes] ${args.check ? 'checked' : 'built'} ${tenant.id} -> ${outFile}`);
      } catch (err) {
        failures += 1;
        const detail = (err.stderr || err.stdout || err.message || '').toString().trim();
        console.error(`[themes] FAILED ${tenant.id}: ${detail.split('\n').slice(0, 6).join('\n')}`);
      }
    }
  } finally {
    await rm(staging, { recursive: true, force: true });
  }

  if (failures > 0) {
    console.error(`[themes] ${failures} of ${tenants.length} theme(s) failed`);
    return 1;
  }

  if (!args.check) {
    // A static barrel lets Vite bundle every tenant theme and lets an island
    // pick one by id at runtime, with no dynamic import paths.
    const ids = tenants.map((t) => t.id).sort();
    const imports = ids
      .map((id) => `import {${toIdent(id)}Theme} from './${id}.js';`)
      .join('\n');
    const entries = ids.map((id) => `  ${JSON.stringify(id)}: ${toIdent(id)}Theme,`).join('\n');
    const barrel = `// @generated by scripts/build-tenant-themes.mjs — do not edit.
${imports}

/** Every tenant's compiled Astryx theme, keyed by tenant id. */
export const tenantThemes = {
${entries}
};

/** @typedef {keyof typeof tenantThemes} TenantThemeId */
`;
    await writeFile(join(outDir, 'index.js'), barrel, 'utf8');

    const dts = `// @generated by scripts/build-tenant-themes.mjs — do not edit.
import type {DefinedTheme} from '@astryxdesign/core/theme';
export declare const tenantThemes: Record<string, DefinedTheme>;
`;
    await writeFile(join(outDir, 'index.d.ts'), dts, 'utf8');
    console.log(`[themes] wrote barrel for ${ids.length} tenant(s)`);
  }
  console.log(`[themes] ${tenants.length} theme(s) OK`);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error('[themes] unexpected error:', err);
    process.exit(1);
  },
);
