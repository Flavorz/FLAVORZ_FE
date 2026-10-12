import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TENANT_ID,
  allTenants,
  hostMatches,
  normalizeHost,
  resolveTenantByHost,
  tenantById,
} from '../src/lib/tenant/resolve';
import { parseTenantConfig } from '../src/lib/tenant/schema';

describe('normalizeHost', () => {
  it('lowercases, strips port and trailing dot', () => {
    expect(normalizeHost('Flavorz.Example.COM:8080')).toBe('flavorz.example.com');
    expect(normalizeHost('acme.com.')).toBe('acme.com');
    expect(normalizeHost('  localhost  ')).toBe('localhost');
  });
});

describe('hostMatches', () => {
  it('matches exact hosts', () => {
    expect(hostMatches('acme.com', 'acme.com')).toBe(true);
    expect(hostMatches('acme.com', 'other.com')).toBe(false);
  });

  it('matches one or more leading labels for a wildcard', () => {
    expect(hostMatches('*.acme.com', 'app.acme.com')).toBe(true);
    expect(hostMatches('*.acme.com', 'a.b.acme.com')).toBe(true);
  });

  it('does not let a wildcard match the bare apex', () => {
    expect(hostMatches('*.acme.com', 'acme.com')).toBe(false);
  });

  it('does not match a suffix that is not a label boundary', () => {
    expect(hostMatches('*.acme.com', 'evilacme.com')).toBe(false);
  });

  it('rejects empty input', () => {
    expect(hostMatches('', 'acme.com')).toBe(false);
    expect(hostMatches('*.acme.com', '')).toBe(false);
  });
});

describe('tenant configs', () => {
  it('loads and validates every bundled tenant', () => {
    const tenants = allTenants();
    expect(tenants.size).toBeGreaterThanOrEqual(2);
    for (const tenant of tenants.values()) {
      expect(parseTenantConfig(tenant).ok).toBe(true);
    }
  });

  it('exposes the default tenant', () => {
    expect(tenantById(DEFAULT_TENANT_ID)).not.toBeNull();
  });
});

describe('resolveTenantByHost', () => {
  it('resolves a known host to its tenant', () => {
    expect(resolveTenantByHost('verdant.example.com').id).toBe('verdant');
    expect(resolveTenantByHost('localhost').id).toBe('flavorz');
  });

  it('is case and port insensitive', () => {
    expect(resolveTenantByHost('VERDANT.example.com:4321').id).toBe('verdant');
  });

  it('prefers an exact match over a wildcard', () => {
    // flavorz claims *.flavorz.example.com; an exact host must still win.
    expect(resolveTenantByHost('flavorz.example.com').id).toBe('flavorz');
  });

  it('resolves wildcard subdomains', () => {
    expect(resolveTenantByHost('order.flavorz.example.com').id).toBe('flavorz');
  });

  it('falls back to the default tenant for an unknown host', () => {
    expect(resolveTenantByHost('nobody-knows-this-host.test').id).toBe(DEFAULT_TENANT_ID);
  });
});

describe('schema validation', () => {
  it('rejects a bad id', () => {
    const r = parseTenantConfig({
      id: 'Not Valid',
      name: 'x',
      hosts: ['a.com'],
      theme: { accent: '#fff' },
      assets: { logo: '/l.svg' },
    });
    expect(r.ok).toBe(false);
  });

  it('rejects a non-hex accent', () => {
    const r = parseTenantConfig({
      id: 'ok-id',
      name: 'x',
      hosts: ['a.com'],
      theme: { accent: 'rebeccapurple' },
      assets: { logo: '/l.svg' },
    });
    expect(r.ok).toBe(false);
  });

  it('accepts a [light, dark] accent pair and applies defaults', () => {
    const r = parseTenantConfig({
      id: 'ok-id',
      name: 'x',
      hosts: ['a.com'],
      theme: { accent: ['#000000', '#ffffff'] },
      assets: { logo: '/l.svg' },
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.theme.neutralStyle).toBe('neutral');
      expect(r.value.assets.favicon).toBe('/favicon.svg');
    }
  });
});
