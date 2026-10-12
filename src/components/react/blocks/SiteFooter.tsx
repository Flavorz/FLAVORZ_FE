import { Stack } from '@astryxdesign/core/Stack';
import { Section } from '@astryxdesign/core/Section';
import { Text } from '@astryxdesign/core/Text';
import type { TenantConfig } from '../../../lib/tenant/schema';

/**
 * Site footer. Legal line and support contact both come from the tenant.
 */
export function SiteFooter({ tenant }: { tenant: TenantConfig }) {
  const year = new Date().getFullYear();
  const email = tenant.runtime.supportEmail;

  return (
    <Section variant="transparent" paddingBlock={6} paddingInline={6} dividers={['top']}>
      <Stack direction="horizontal" gap={4} align="center" maxWidth={1200} width="100%">
        <Text type="supporting">
          © {year} {tenant.name}
        </Text>
        {email && (
          <a href={`mailto:${email}`} style={{ color: 'var(--color-text-secondary)' }}>
            <Text type="supporting">{email}</Text>
          </a>
        )}
      </Stack>
    </Section>
  );
}
