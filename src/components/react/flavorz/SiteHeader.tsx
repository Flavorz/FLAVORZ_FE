import { Stack, StackItem } from '@astryxdesign/core/Stack';
import { Section } from '@astryxdesign/core/Section';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Avatar } from '@astryxdesign/core/Avatar';
import { TextInput } from '@astryxdesign/core/TextInput';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { useState } from 'react';
import type { TenantConfig } from '../../../lib/tenant/schema';

const NAV = ['Offers', 'Community', 'Orders', 'Shop'];

/**
 * Header: wordmark, search, language toggle, live count, profile tier.
 *
 * The language toggle (EN | ಕನ್ನಡ) is in the design, so it ships as real UI
 * rather than a placeholder — Kannada is a first-class audience here.
 */
export function SiteHeader({
  tenant,
  onlineCount = 128,
  location = 'Jp Nagar, Bangalore',
}: {
  tenant: TenantConfig;
  onlineCount?: number;
  location?: string;
}) {
  const [query, setQuery] = useState('');
  const [lang, setLang] = useState('en');

  return (
    <Section variant="transparent" paddingBlock={0} paddingInline={0}>
      <Stack direction="vertical" gap={0}>
        <Section variant="transparent" paddingBlock={2} paddingInline={6} dividers={['bottom']}>
          <Stack direction="horizontal" gap={4} align="center" maxWidth={1400} width="100%">
            <Stack direction="horizontal" gap={1.5} align="center">
              <span
                aria-hidden="true"
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-element)',
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-on-accent)',
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 18,
                }}
              >
                f
              </span>
              <Text type="display-3" as="span">
                {tenant.name}
              </Text>
            </Stack>

            <StackItem size="fill">
              <TextInput
                label="Search"
                isLabelHidden
                value={query}
                onChange={setQuery}
                placeholder='Search "avarekalu", "podi", "Lakshmi Amma"'
              />
            </StackItem>

            <Badge label={`${onlineCount} online now`} variant="success" />

            <SegmentedControl
              label="Language"
              value={lang}
              onChange={setLang}
              size="sm"
            >
              <SegmentedControlItem value="en" label="EN" />
              <SegmentedControlItem value="kn" label="ಕನ್ನಡ" />
            </SegmentedControl>

            <Avatar name="Sarath R" size="sm" />
          </Stack>
        </Section>

        <Section variant="transparent" paddingBlock={1.5} paddingInline={6} dividers={['bottom']}>
          <Stack direction="horizontal" gap={4} align="center" maxWidth={1400} width="100%">
            <Text type="supporting">{location}</Text>
            <StackItem size="fill">
              <Stack direction="horizontal" gap={4} justify="end">
                {NAV.map((item) => (
                  <a key={item} href={`#${item.toLowerCase()}`} style={{ textDecoration: 'none' }}>
                    <Text type="label" color="primary">
                      {item}
                    </Text>
                  </a>
                ))}
              </Stack>
            </StackItem>
          </Stack>
        </Section>
      </Stack>
    </Section>
  );
}
