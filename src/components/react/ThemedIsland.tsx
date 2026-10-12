import { type ReactNode, useEffect, useState } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { themes, defaultThemeSlug } from '../../astryx-themes';
import { tenantThemes } from '../../generated/themes/index.js';
import type { TenantConfig } from '../../lib/tenant/schema';
import { TENANT_GLOBAL } from '../../lib/tenant/context';

/**
 * Wraps a React island in the Astryx Theme provider and supplies the tenant.
 *
 * Every island needs this: Astro mounts islands independently, so there is no
 * single React root to hold the provider.
 *
 * Why the tenant's OWN compiled theme rather than the base one
 * -----------------------------------------------------------
 * <Theme> writes `data-astryx-theme="<theme.name>"` on its wrapper element,
 * and Astryx's generated CSS is scoped to that attribute. Passing the base
 * theme therefore makes the island resolve BASE tokens even when <html> says
 * the tenant — the brand silently reverts inside every island. Handing it the
 * tenant's compiled theme keeps the attribute, the CSS scope and the brand in
 * agreement.
 *
 * Tenant themes are compiled by scripts/build-tenant-themes.mjs and bundled
 * through src/generated/themes. A tenant with no compiled theme yet falls back
 * to the base, which is unbranded but never broken.
 */
export function ThemedIsland({
  tenant,
  children,
}: {
  tenant?: TenantConfig;
  children: ReactNode | ((tenant: TenantConfig) => ReactNode);
}) {
  // Prefer the prop (available during SSR); fall back to the injected global.
  const [resolved, setResolved] = useState<TenantConfig | null>(tenant ?? null);

  useEffect(() => {
    if (resolved) return;
    const fromWindow = window[TENANT_GLOBAL];
    if (fromWindow) setResolved(fromWindow);
  }, [resolved]);

  if (!resolved) {
    // Render nothing rather than an unbranded flash.
    return null;
  }

  // Both lookups are indexed, so each may be undefined. A tenant without a
  // compiled theme falls back to the base; a missing base is a build error
  // worth surfacing loudly rather than rendering an unthemed island.
  const theme = tenantThemes[resolved.id] ?? themes[defaultThemeSlug];
  if (!theme) {
    throw new Error(
      `No theme for tenant "${resolved.id}" and no base theme "${defaultThemeSlug}". ` +
        'Run `pnpm run theme:build`.',
    );
  }

  return (
    <Theme theme={theme} mode="system">
      {typeof children === 'function' ? children(resolved) : children}
    </Theme>
  );
}
