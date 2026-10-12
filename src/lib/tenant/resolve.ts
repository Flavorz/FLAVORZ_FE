import { parseTenantConfig, type TenantConfig } from './schema';

/**
 * Tenant resolution.
 *
 * One static build serves every brand, so "which tenant am I?" is answered
 * from the request hostname rather than at build time.
 *
 * Two sources, swapped by `TENANT_SOURCE`:
 *   'bundled' — tenant JSON compiled into the bundle (default today; the
 *               backend is not ready yet, and this keeps the app runnable).
 *   'api'     — `GET {TENANT_API}/tenant-config?host=<host>`, the production
 *               path once the backend exists. Only this branch needs to
 *               change when it does.
 */

export const DEFAULT_TENANT_ID = 'flavorz';

/** Build-time inlined tenant configs. Vite resolves this glob eagerly. */
const bundled = import.meta.glob<{ default: unknown }>('../../../config/tenants/*.json', {
  eager: true,
});

let cache: Map<string, TenantConfig> | null = null;

function loadBundled(): Map<string, TenantConfig> {
  if (cache) return cache;
  const map = new Map<string, TenantConfig>();
  for (const [path, mod] of Object.entries(bundled)) {
    const parsed = parseTenantConfig(mod.default);
    if (!parsed.ok) {
      // A malformed tenant must not take down every other brand.
      console.error(`[tenant] ignoring ${path}: ${parsed.error}`);
      continue;
    }
    map.set(parsed.value.id, parsed.value);
  }
  cache = map;
  return map;
}

/** Normalize a hostname: strip port, lowercase, drop a trailing dot. */
export function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/\.$/, '').split(':')[0] ?? '';
}

/**
 * Does `pattern` match `host`?
 *
 * Supports an exact match and a single leading `*.` wildcard, which matches
 * one or more leading labels (`*.acme.com` matches `app.acme.com` and
 * `a.b.acme.com`, but not bare `acme.com`).
 */
export function hostMatches(pattern: string, host: string): boolean {
  const p = normalizeHost(pattern);
  const h = normalizeHost(host);
  if (!p || !h) return false;
  if (p === h) return true;
  if (p.startsWith('*.')) {
    const suffix = p.slice(1); // ".acme.com"
    return h.endsWith(suffix) && h.length > suffix.length;
  }
  return false;
}

/** All known tenants, keyed by id. */
export function allTenants(): ReadonlyMap<string, TenantConfig> {
  return loadBundled();
}

/** Look a tenant up by its id. */
export function tenantById(id: string): TenantConfig | null {
  return loadBundled().get(id) ?? null;
}

/**
 * Resolve the tenant for a hostname.
 *
 * Exact host matches win over wildcard matches, so a specific override always
 * beats a catch-all. Falls back to the default tenant so the page always
 * renders branded rather than bare.
 */
export function resolveTenantByHost(host: string): TenantConfig {
  const tenants = loadBundled();
  const h = normalizeHost(host);

  let wildcard: TenantConfig | null = null;
  for (const tenant of tenants.values()) {
    for (const pattern of tenant.hosts) {
      if (normalizeHost(pattern) === h) return tenant;
      if (!wildcard && hostMatches(pattern, h)) wildcard = tenant;
    }
  }
  if (wildcard) return wildcard;

  const fallback = tenants.get(DEFAULT_TENANT_ID) ?? tenants.values().next().value;
  if (!fallback) throw new Error('[tenant] no tenant configs found');
  return fallback;
}

/**
 * Fetch a tenant from the backend. Unused until the API exists; wired here so
 * switching source is a one-line change rather than a refactor.
 */
export async function fetchTenantFromApi(
  host: string,
  apiBase: string,
  init?: RequestInit,
): Promise<TenantConfig | null> {
  const url = new URL('/tenant-config', apiBase);
  url.searchParams.set('host', normalizeHost(host));
  try {
    const res = await fetch(url, { ...init, headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    const parsed = parseTenantConfig(await res.json());
    if (!parsed.ok) {
      console.error(`[tenant] API returned invalid config for ${host}: ${parsed.error}`);
      return null;
    }
    return parsed.value;
  } catch (err) {
    console.error(`[tenant] API lookup failed for ${host}:`, err);
    return null;
  }
}
