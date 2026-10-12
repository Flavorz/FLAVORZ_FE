import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@astryxdesign/core/Button';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { ThemedIsland } from './ThemedIsland';
import { copy } from '../../lib/tenant/context';
import type { TenantConfig } from '../../lib/tenant/schema';

/**
 * The branded hero. Every visible string and color comes from the tenant, so
 * this file never needs editing to onboard a brand.
 */
function HeroInner({ tenant }: { tenant: TenantConfig }) {
  const reduce = useReducedMotion();

  const rise = (delay: number) =>
    reduce
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <Stack direction="vertical" gap={4} padding={6} maxWidth={720}>
      <motion.div {...rise(0)}>
        <Heading level={1}>{copy(tenant, 'hero.title', `Welcome to ${tenant.name}`)}</Heading>
      </motion.div>

      <motion.div {...rise(0.08)}>
        <Text type="supporting" as="p">
          {copy(tenant, 'hero.subtitle', 'A white-label experience, themed per brand.')}
        </Text>
      </motion.div>

      <motion.div {...rise(0.16)}>
        <Stack direction="horizontal" gap={2}>
          <Button label={copy(tenant, 'nav.cta', 'Get started')} variant="primary" size="lg" />
          <Button label="Learn more" variant="ghost" size="lg" />
        </Stack>
      </motion.div>
    </Stack>
  );
}

export default function Hero({ tenant }: { tenant?: TenantConfig }) {
  return <ThemedIsland tenant={tenant}>{(t) => <HeroInner tenant={t} />}</ThemedIsland>;
}
