import { z } from 'zod';

/**
 * The tenant configuration contract.
 *
 * This is the single source of truth for everything a brand can change
 * without a code change. The backend will eventually serve exactly this
 * shape from `GET /api/v1/tenant-config?host=<hostname>`; until then
 * `config/tenants/*.json` files stand in for it, validated by the same
 * schema so the swap is a one-line change in `resolve.ts`.
 *
 * Keep this schema and the backend's serializer in lockstep. A tenant that
 * fails validation falls back to the default tenant rather than rendering
 * a half-branded page.
 */

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const hexColor = z
  .string()
  .regex(HEX, 'must be a hex color such as #0064E0');

/** A token value: one color for both modes, or an explicit [light, dark] pair. */
const tokenValue = z.union([hexColor, z.tuple([hexColor, hexColor])]);

/**
 * Astryx expands a single accent seed into the full ramp — surfaces, text,
 * icons, borders, hover/pressed overlays — for light and dark, holding
 * >= 4.5:1 for generated text. Most tenants should only need `accent`.
 */
export const brandThemeSchema = z.object({
  /** Seed color. One hex, or [light, dark] to seed each scheme separately. */
  accent: tokenValue,
  /** Temperature of the generated greys. */
  neutralStyle: z.enum(['warm', 'cool', 'neutral']).default('neutral'),
  /** 'high' widens the text/surface tone gap for dense or clinical UI. */
  contrast: z.enum(['standard', 'high']).default('standard'),
  /**
   * Escape hatch for explicit token overrides, applied after generation.
   *
   * Note: status colors (success/warning/error) and categorical data hues are
   * NOT derived from `accent` by Astryx — they keep framework defaults tuned
   * for the default surfaces. A tenant with an unusual palette should set them
   * here and check contrast in both modes.
   */
  tokens: z.record(z.string().startsWith('--'), tokenValue).default({}),
  /** Optional radius scale override: 'sharp' | 'soft' | 'round'. */
  radius: z.enum(['sharp', 'soft', 'round']).optional(),
});

export const brandAssetsSchema = z.object({
  /** Primary logo, light-mode. Path relative to the tenant asset root, or absolute URL. */
  logo: z.string().min(1),
  /** Optional dark-mode logo. Falls back to `logo`. */
  logoDark: z.string().min(1).optional(),
  favicon: z.string().min(1).default('/favicon.svg'),
  /** Open Graph / social share image. */
  ogImage: z.string().min(1).optional(),
});

export const tenantConfigSchema = z.object({
  /** Stable machine id. Used as the Astryx theme name and the CSS filename. */
  id: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/, 'lowercase kebab-case, 3-40 chars'),
  /** Human-facing brand name, used in titles and copy. */
  name: z.string().min(1),
  /** Hostnames that resolve to this tenant. Matched case-insensitively. */
  hosts: z.array(z.string().min(1)).min(1),
  theme: brandThemeSchema,
  assets: brandAssetsSchema,
  /** Per-tenant copy overrides. Keys are dot-paths into the base string table. */
  copy: z.record(z.string(), z.string()).default({}),
  /** Public runtime values only. Never put secrets here — this ships to the browser. */
  runtime: z
    .object({
      apiBaseUrl: z.url().optional(),
      supportEmail: z.email().optional(),
    })
    .default({}),
});

export type BrandTheme = z.infer<typeof brandThemeSchema>;
export type BrandAssets = z.infer<typeof brandAssetsSchema>;
export type TenantConfig = z.infer<typeof tenantConfigSchema>;

/** Parse untrusted config, returning a typed result instead of throwing. */
export function parseTenantConfig(
  input: unknown,
): { ok: true; value: TenantConfig } | { ok: false; error: string } {
  const result = tenantConfigSchema.safeParse(input);
  if (result.success) return { ok: true, value: result.data };
  const issues = result.error.issues
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('; ');
  return { ok: false, error: issues };
}
