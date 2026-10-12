import { Stack } from '@astryxdesign/core/Stack';
import { Section } from '@astryxdesign/core/Section';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { ThemedIsland } from './ThemedIsland';
import { SiteHeader, HeroBlock, FeatureGrid, SiteFooter, TokenSwatches } from './blocks';
import type { TenantConfig } from '../../lib/tenant/schema';

/**
 * Living documentation: every block rendered in the brand being previewed.
 *
 * This is the design system's own reference. Because it renders the real
 * components under the real theme, it cannot drift from the implementation
 * the way a written spec does.
 */
function Entry({
  name,
  note,
  children,
}: {
  name: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <Stack direction="vertical" gap={2}>
      <Stack direction="horizontal" gap={2} align="center">
        <Heading level={3}>{name}</Heading>
        <Badge label="block" variant="neutral" />
      </Stack>
      <Text type="supporting" as="p">
        {note}
      </Text>
      {/*
        Card, not a raw <div>: a bare div gives the preview no layout context
        and the nested Section collapses to a couple of pixels. Padding 0 keeps
        each block edge-to-edge inside its frame.
      */}
      <Card padding={0} width="100%">
        {children}
      </Card>
    </Stack>
  );
}

function GalleryInner({ tenant }: { tenant: TenantConfig }) {
  return (
    <Stack direction="vertical" gap={0}>
      <Section variant="transparent" paddingBlock={8} paddingInline={6}>
        <Stack direction="vertical" gap={2} maxWidth={1100} width="100%">
          <Heading level={1}>Design system</Heading>
          <Text type="large" as="p" color="secondary">
            Every block, rendered in the {tenant.name} brand. Switch brands with the
            /design/&lt;tenant&gt; routes to see the same components re-skinned.
          </Text>
        </Stack>
      </Section>

      <TokenSwatches />

      <Section variant="transparent" paddingBlock={8} paddingInline={6}>
        <Stack direction="vertical" gap={8} maxWidth={1100} width="100%">
          <Heading level={2}>Blocks</Heading>

          <Entry name="SiteHeader" note="Brand mark, navigation and primary call to action.">
            <SiteHeader tenant={tenant} links={[{ label: 'Menu', href: '#' }]} />
          </Entry>

          <Entry name="HeroBlock" note="Page headline with a staggered entrance animation.">
            <HeroBlock tenant={tenant} />
          </Entry>

          <Entry name="FeatureGrid" note="Responsive card grid; columns reflow on width.">
            <FeatureGrid
              heading="Example heading"
              items={[
                { title: 'One', body: 'First feature description.' },
                { title: 'Two', body: 'Second feature description.' },
              ]}
            />
          </Entry>

          <Entry name="SiteFooter" note="Legal line and support contact from tenant config.">
            <SiteFooter tenant={tenant} />
          </Entry>
        </Stack>
      </Section>
    </Stack>
  );
}

export default function DesignSystemGallery({ tenant }: { tenant?: TenantConfig }) {
  return <ThemedIsland tenant={tenant}>{(t) => <GalleryInner tenant={t} />}</ThemedIsland>;
}
