import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { beforeAll, describe, expect, it } from 'vitest';

const run = promisify(execFile);
const ROOT = resolve(import.meta.dirname, '..');
const themeDir = resolve(ROOT, 'src/generated/themes');
const publicThemeDir = resolve(ROOT, 'public/themes');

/**
 * These tests guard the white-label mechanism itself: that a tenant's brand
 * seed actually reaches the compiled CSS. A silently-ignored defineTheme key
 * (e.g. `colorScale` instead of `color`) produces a valid-looking build with
 * the DEFAULT palette, which is exactly the bug these assertions catch.
 */
describe('tenant theme build', () => {
  beforeAll(async () => {
    if (!existsSync(resolve(themeDir, 'flavorz.css'))) {
      await run('node', ['scripts/build-tenant-themes.mjs'], { cwd: ROOT });
    }
  }, 300_000);

  it('emits one CSS file per tenant', () => {
    expect(existsSync(resolve(themeDir, 'flavorz.css'))).toBe(true);
    expect(existsSync(resolve(themeDir, 'verdant.css'))).toBe(true);
  });

  it('scopes each theme to its own data-astryx-theme attribute', async () => {
    const css = await readFile(resolve(themeDir, 'flavorz.css'), 'utf8');
    expect(css).toContain('data-astryx-theme="flavorz"');
    expect(css).not.toContain('data-astryx-theme="verdant"');
  });

  it('derives a distinct accent per brand from its seed', async () => {
    const flavorz = await readFile(resolve(themeDir, 'flavorz.css'), 'utf8');
    const verdant = await readFile(resolve(themeDir, 'verdant.css'), 'utf8');

    const accentOf = (css: string) =>
      css.match(/--color-accent:\s*light-dark\(([^)]+)\)/)?.[1]?.trim() ?? null;

    const a = accentOf(flavorz);
    const b = accentOf(verdant);

    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    // The whole point of white-labeling: two brands must not share a palette.
    expect(a).not.toBe(b);
  });

  it('tints neutral surfaces per brand rather than reusing one grey', async () => {
    const flavorz = await readFile(resolve(themeDir, 'flavorz.css'), 'utf8');
    const verdant = await readFile(resolve(themeDir, 'verdant.css'), 'utf8');
    const bodyOf = (css: string) =>
      css.match(/--color-background-body:\s*light-dark\(([^)]+)\)/)?.[1]?.trim() ?? null;
    expect(bodyOf(flavorz)).not.toBe(bodyOf(verdant));
  });

  it('generates a full token set, not just the accent', async () => {
    const css = await readFile(resolve(themeDir, 'flavorz.css'), 'utf8');
    const tokens = new Set(css.match(/--[a-z0-9-]+:/g) ?? []);
    expect(tokens.size).toBeGreaterThan(100);
    for (const required of [
      '--color-accent:',
      '--color-on-accent:',
      '--color-background-body:',
      '--color-text-primary:',
      '--color-border:',
    ]) {
      expect(tokens.has(required)).toBe(true);
    }
  });
});

describe('per-brand typography and motion', () => {
  it('gives each brand its own font family', async () => {
    const flavorz = await readFile(resolve(themeDir, 'flavorz.css'), 'utf8');
    const verdant = await readFile(resolve(themeDir, 'verdant.css'), 'utf8');
    const familyOf = (css: string) =>
      css.match(/--font-family-body:\s*([^;]+)/)?.[1]?.trim() ?? null;

    expect(familyOf(flavorz)).toContain('Fraunces');
    expect(familyOf(verdant)).toContain('DM Sans');
  });

  it('derives a different type scale per brand', async () => {
    const flavorz = await readFile(resolve(themeDir, 'flavorz.css'), 'utf8');
    const verdant = await readFile(resolve(themeDir, 'verdant.css'), 'utf8');
    const baseOf = (css: string) => css.match(/--font-size-base:\s*([^;]+)/)?.[1]?.trim() ?? null;
    expect(baseOf(flavorz)).not.toBe(baseOf(verdant));
  });

  it('gives each brand its own motion tempo', async () => {
    const flavorz = await readFile(resolve(themeDir, 'flavorz.css'), 'utf8');
    const verdant = await readFile(resolve(themeDir, 'verdant.css'), 'utf8');
    const durOf = (css: string) => css.match(/--duration-medium:\s*([^;]+)/)?.[1]?.trim() ?? null;
    expect(durOf(flavorz)).toBe('500ms');
    expect(durOf(verdant)).toBe('250ms');
  });

  it('emits font-loading CSS for a declared family', async () => {
    // Astryx sets the stack but never loads a file; without this the brand
    // silently renders its fallback.
    const fonts = await readFile(resolve(publicThemeDir, 'flavorz.fonts.css'), 'utf8');
    expect(fonts).toContain('fonts.googleapis.com');
    expect(fonts).toContain('Fraunces');
  });
});
