import { motion, useReducedMotion } from 'motion/react';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { Stack } from '@astryxdesign/core/Stack';
import { Section } from '@astryxdesign/core/Section';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';

export interface FeatureItem {
  title: string;
  body: string;
}

/**
 * A responsive grid of feature cards.
 *
 * Cards earn their container here: each item is discrete and comparable, which
 * is the case Astryx says Card is for. Columns reflow on width rather than at
 * fixed breakpoints.
 */
export function FeatureGrid({
  heading,
  items,
}: {
  heading?: string;
  items: ReadonlyArray<FeatureItem>;
}) {
  const reduce = useReducedMotion();

  return (
    <Section variant="muted" paddingBlock={10} paddingInline={6}>
      <Stack direction="vertical" gap={6} maxWidth={1100} width="100%">
        {heading && <Heading level={2}>{heading}</Heading>}

        <Grid columns={{ minWidth: 240, max: 3 }} gap={4}>
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: reduce ? 0 : i * 0.06 }}
            >
              <Card padding={4} height="100%">
                <Stack direction="vertical" gap={2}>
                  <Heading level={3}>{item.title}</Heading>
                  <Text type="supporting" as="p">
                    {item.body}
                  </Text>
                </Stack>
              </Card>
            </motion.div>
          ))}
        </Grid>
      </Stack>
    </Section>
  );
}
