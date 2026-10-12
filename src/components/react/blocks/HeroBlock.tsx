import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@astryxdesign/core/Button';
import { Stack } from '@astryxdesign/core/Stack';
import { Section } from '@astryxdesign/core/Section';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { copy } from '../../../lib/tenant/context';
import type { TenantConfig } from '../../../lib/tenant/schema';

/**
 * Page hero with a staggered entrance.
 *
 * The animation reads its tempo from the brand's own `--duration-*` tokens, so
 * a snappy brand and a cinematic one animate differently from the same code.
 */
export function HeroBlock({ tenant }: { tenant: TenantConfig }) {
  const reduce = useReducedMotion();

  const rise = (delay: number) =>
    reduce
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <Section variant="transparent" paddingBlock={10} paddingInline={6}>
      <Stack direction="vertical" gap={5} maxWidth={760} width="100%">
        <motion.div {...rise(0)}>
          <Heading level={1} type="display-2">
            {copy(tenant, 'hero.title', `Welcome to ${tenant.name}`)}
          </Heading>
        </motion.div>

        <motion.div {...rise(0.08)}>
          <Text type="large" as="p" color="secondary">
            {copy(tenant, 'hero.subtitle', 'A white-label experience, themed per brand.')}
          </Text>
        </motion.div>

        <motion.div {...rise(0.16)}>
          <Stack direction="horizontal" gap={2}>
            <Button label={copy(tenant, 'nav.cta', 'Get started')} variant="primary" size="lg" />
            <Button label={copy(tenant, 'hero.secondary', 'Learn more')} variant="ghost" size="lg" />
          </Stack>
        </motion.div>
      </Stack>
    </Section>
  );
}
