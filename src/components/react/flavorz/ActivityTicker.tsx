import { Stack } from '@astryxdesign/core/Stack';
import { Section } from '@astryxdesign/core/Section';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import type { ActivityItem } from './types';

/**
 * The live activity strip.
 *
 * Deliberately NOT auto-scrolling: motion that the viewer cannot pause is a
 * WCAG 2.2.2 problem, and the design shows a static row. It scrolls by hand.
 */
export function ActivityTicker({ items }: { items: ReadonlyArray<ActivityItem> }) {
  return (
    <Section variant="muted" paddingBlock={1.5} paddingInline={6}>
      <Stack direction="horizontal" gap={3} align="center" isScrollable>
        <Badge label="Live" variant="error" />
        {items.map((item) => (
          <Text key={item.id} type="supporting">
            {item.text}
          </Text>
        ))}
      </Stack>
    </Section>
  );
}
