import { Stack, StackItem } from '@astryxdesign/core/Stack';
import { Button } from '@astryxdesign/core/Button';
import { Section } from '@astryxdesign/core/Section';
import { Text } from '@astryxdesign/core/Text';
import { copy } from '../../../lib/tenant/context';
import type { TenantConfig } from '../../../lib/tenant/schema';

export interface NavLink {
  label: string;
  href: string;
}

/**
 * Site header: brand mark, navigation, primary call to action.
 *
 * Brand-agnostic by construction — the logo, name and CTA label all come from
 * the tenant, and every colour, font and radius resolves from theme tokens.
 */
export function SiteHeader({ tenant, links = [] }: { tenant: TenantConfig; links?: NavLink[] }) {
  return (
    <Section variant="transparent" paddingBlock={3} paddingInline={6} dividers={['bottom']}>
      <Stack direction="horizontal" gap={4} align="center" maxWidth={1200} width="100%">
        <Stack direction="horizontal" gap={2} align="center">
          {/*
            The logo is an inline SVG using currentColor, so it must be masked
            rather than <img>-embedded: an <img> is an opaque document and
            cannot inherit the page's text colour.
          */}
          <span
            aria-label={tenant.name}
            role="img"
            style={{
              display: 'block',
              width: 110,
              height: 28,
              backgroundColor: 'var(--color-text-primary)',
              maskImage: `url(${tenant.assets.logo})`,
              maskRepeat: 'no-repeat',
              maskPosition: 'left center',
              maskSize: 'contain',
              WebkitMaskImage: `url(${tenant.assets.logo})`,
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'left center',
              WebkitMaskSize: 'contain',
            }}
          />
        </Stack>

        <StackItem size="fill">
          <Stack direction="horizontal" gap={4} align="center" justify="end">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}
              >
                <Text type="label">{link.label}</Text>
              </a>
            ))}
            <Button label={copy(tenant, 'nav.cta', 'Get started')} variant="primary" size="sm" />
          </Stack>
        </StackItem>
      </Stack>
    </Section>
  );
}
