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
/**
 * How a brand's font is delivered to the browser.
 *
 * Astryx sets the font *stack* but never loads a file. A named family with no
 * source loads nothing and warns about nothing — the fallback silently becomes
 * the brand's typeface. So a family must declare where it comes from.
 *
 *   'system'  — no loading; the family must be a system/UI stack
 *   'google'  — emit a Google Fonts <link> for this family
 *   'self'    — emit @font-face against files under /fonts/<brand>/
 */
const fontSourceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('system') }),
  z.object({
    type: z.literal('google'),
    /** Axis/weight spec, e.g. 'wght@400;600;700' or 'wght@100..900'. */
    axes: z.string().default('wght@400;500;600;700'),
  }),
  z.object({
    type: z.literal('self'),
    /** Files relative to /fonts/<tenant id>/, e.g. ['Brand.woff2']. */
    files: z.array(z.string().min(1)).min(1),
    weight: z.string().default('400 700'),
    style: z.enum(['normal', 'italic']).default('normal'),
  }),
]);

const fontRoleSchema = z.object({
  /** Family name, exactly as the font declares it. */
  family: z.string().min(1),
  /**
   * Fallback stack. Required: if the family fails to load this is what the
   * brand actually renders as, so it should be a deliberate choice.
   */
  fallbacks: z.string().min(1),
  source: fontSourceSchema.default({ type: 'system' }),
});

/**
 * Per-brand typography.
 *
 * `scale.ratio` drives the whole type scale geometrically:
 * 1.125 dense · 1.2 default · 1.333 dramatic.
 */
export const brandTypographySchema = z.object({
  scale: z
    .object({
      /** Body size in px. */
      base: z.number().int().min(12).max(24).default(16),
      /** Step between sizes. */
      ratio: z.number().min(1.05).max(1.5).default(1.2),
    })
    .default({ base: 16, ratio: 1.2 }),
  body: fontRoleSchema.optional(),
  /** Inherits family and fallbacks from `body` when omitted. */
  heading: fontRoleSchema
    .partial({ family: true, fallbacks: true })
    .extend({
      weight: z.enum(['normal', 'medium', 'semibold', 'bold']).default('semibold'),
      /** Per-level overrides for headings 1-6. */
      weights: z.record(z.string(), z.enum(['normal', 'medium', 'semibold', 'bold'])).optional(),
    })
    .optional(),
  code: fontRoleSchema.optional(),
});

/** Motion tempo, in ms. Lower = snappier. */
export const brandMotionSchema = z.object({
  fast: z.number().int().min(50).max(400).default(175),
  medium: z.number().int().min(100).max(900).default(410),
  slow: z.number().int().min(200).max(2000).default(975),
  ratio: z.number().min(0.4).max(1).default(0.75),
  /** Overrides --ease-standard. */
  easing: z.string().optional(),
});

export const brandThemeSchema = z.object({
  /** Seed color. One hex, or [light, dark] to seed each scheme separately. */
  accent: tokenValue,
  /** Temperature of the generated greys. */
  neutralStyle: z.enum(['warm', 'cool', 'neutral']).default('neutral'),
  /** 'high' widens the text/surface tone gap for dense or clinical UI. */
  contrast: z.enum(['standard', 'high']).default('standard'),
  typography: brandTypographySchema.optional(),
  motion: brandMotionSchema.optional(),
  /**
   * Escape hatch for explicit token overrides, applied after generation.
   *
   * Note: status colors (success/warning/error) and categorical data hues are
   * NOT derived from `accent` by Astryx — they keep framework defaults tuned
   * for the default surfaces. A tenant with an unusual palette should set them
   * here and check contrast in both modes.
   */
  tokens: z.record(z.string().startsWith('--'), tokenValue).default({}),
  /**
   * Corner style: a preset word, or an explicit scale.
   * `base` is the unit in px; `multiplier` scales every step
   * (0 = square/brutalist, 2 = very soft).
   */
  radius: z
    .union([
      z.enum(['sharp', 'soft', 'round']),
      z.object({
        base: z.number().min(0).max(16).default(4),
        multiplier: z.number().min(0).max(3).default(1),
      }),
    ])
    .optional(),
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

export type BrandTypography = z.infer<typeof brandTypographySchema>;
export type BrandMotion = z.infer<typeof brandMotionSchema>;
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
