import { Stack, StackItem } from '@astryxdesign/core/Stack';
import { ThemedIsland } from './ThemedIsland';
import { SiteHeader, HeroBlock, FeatureGrid, SiteFooter } from './blocks';
import type { FeatureItem, NavLink } from './blocks';
import type { TenantConfig } from '../../lib/tenant/schema';

/**
 * The full landing page, composed from brand-agnostic blocks.
 *
 * Nothing here names a brand. Swapping the tenant changes colour, type,
 * motion, copy and logo without touching this file.
 */
const NAV: NavLink[] = [
  { label: 'Menu', href: '#menu' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

const FEATURES: FeatureItem[] = [
  { title: 'Seasonal menu', body: 'Dishes that change with what the growers bring in each week.' },
  { title: 'Open kitchen', body: 'Watch every plate come together from the counter.' },
  { title: 'Natural wine', body: 'A short, well-chosen list that favours small producers.' },
];

function LandingInner({ tenant }: { tenant: TenantConfig }) {
  return (
    <Stack direction="vertical" gap={0} minHeight="100dvh">
      <SiteHeader tenant={tenant} links={NAV} />
      {/* fill pushes the footer to the bottom on short pages. */}
      <StackItem size="fill">
        <HeroBlock tenant={tenant} />
        <FeatureGrid heading="What to expect" items={FEATURES} />
      </StackItem>
      <SiteFooter tenant={tenant} />
    </Stack>
  );
}

export default function LandingPage({ tenant }: { tenant?: TenantConfig }) {
  return <ThemedIsland tenant={tenant}>{(t) => <LandingInner tenant={t} />}</ThemedIsland>;
}
