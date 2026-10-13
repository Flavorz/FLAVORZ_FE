import { Card } from '@astryxdesign/core/Card';
import { Stack, StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { formatInr } from './format';
import type { Reel } from './types';

/**
 * Reel card: a maker video with the product buyable inline.
 *
 * The media area is a flat token-coloured block rather than a gradient — the
 * design uses photography, and a placeholder should read as a placeholder.
 */
export function ReelCard({ reel, onBuy }: { reel: Reel; onBuy?: (id: string) => void }) {
  return (
    <Card padding={0} height="100%">
      <Stack direction="vertical" gap={0} height="100%">
        <Stack
          direction="vertical"
          gap={0}
          padding={2}
          minHeight={240}
          style={{ backgroundColor: 'var(--color-background-muted)' }}
        >
          <Badge label={reel.kind} variant="neutral" />
          <StackItem size="fill">
            <Stack direction="vertical" gap={0.5} justify="end" height="100%">
              <Text type="label">{reel.maker.name}</Text>
              <Text type="supporting">{reel.caption}</Text>
            </Stack>
          </StackItem>
        </Stack>

        <Stack direction="horizontal" gap={2} align="center" padding={2}>
          <Stack direction="vertical" gap={0}>
            <Text type="supporting">{reel.product.name}</Text>
            <Text type="label">{formatInr(reel.product.priceInr)}</Text>
          </Stack>
          <StackItem size="fill">
            <Stack direction="horizontal" justify="end">
              <Button label="Buy" variant="primary" size="sm" onClick={() => onBuy?.(reel.id)} />
            </Stack>
          </StackItem>
        </Stack>
      </Stack>
    </Card>
  );
}
