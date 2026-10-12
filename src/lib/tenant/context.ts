import type { TenantConfig } from './schema';

/**
 * The resolved tenant, exposed to React islands.
 *
 * Astro renders each island independently, so there is no shared React tree to
 * hang a Provider from at the top level. Instead the layout serializes the
 * resolved tenant into the page, and islands read it synchronously from there.
 * This keeps islands free of prop-drilling and avoids a second resolve pass.
 */

export const TENANT_GLOBAL = '__FLAVORZ_TENANT__';

declare global {
  interface Window {
    [TENANT_GLOBAL]?: TenantConfig;
  }
}

/** Read the tenant injected by the layout. Throws if the layout did not run. */
export function getTenant(): TenantConfig {
  if (typeof window === 'undefined') {
    throw new Error('getTenant() is browser-only; pass the tenant as a prop during SSR');
  }
  const tenant = window[TENANT_GLOBAL];
  if (!tenant) {
    throw new Error(`getTenant(): window.${TENANT_GLOBAL} is missing — is BaseLayout in use?`);
  }
  return tenant;
}

/** Read a tenant copy override, falling back to a default string. */
export function copy(tenant: TenantConfig, key: string, fallback: string): string {
  return tenant.copy[key] ?? fallback;
}
