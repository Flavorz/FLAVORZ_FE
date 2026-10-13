import { Card } from '@astryxdesign/core/Card';
import { Stack, StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Avatar } from '@astryxdesign/core/Avatar';
import { AspectRatio } from '@astryxdesign/core/AspectRatio';
import { formatInr } from './format';
import type { Product } from './types';

/**
 * Product card for "What's fresh today".
 *
 * Maker attribution is part of the card, not a footnote — the whole premise
 * is that you know who made it.
 */
export function ProductCard({ product, onBuy }: { product: Product; onBuy?: (id: string) => void }) {
  return (
    <Card padding={0} height="100%">
      <Stack direction="vertical" gap={0} height="100%">
        <AspectRatio ratio={4 / 3}>
          <Stack
            direction="vertical"
            gap={0}
            padding={2}
            height="100%"
            width="100%"
            style={{ backgroundColor: 'var(--color-background-muted)' }}
          >
            <Stack direction="horizontal" gap={2} align="start">
              {product.tag && <Badge label={product.tag} variant="neutral" />}
              <StackItem size="fill">
                <Stack direction="horizontal" justify="end" align="end" height="100%">
                  <Button
                    label="Buy"
                    variant="primary"
                    size="sm"
                    onClick={() => onBuy?.(product.id)}
                  />
                </Stack>
              </StackItem>
            </Stack>
          </Stack>
        </AspectRatio>

        <Stack direction="vertical" gap={1} padding={3}>
          <Text type="supporting">{product.size}</Text>
          <Text type="label">{product.name}</Text>

          <Stack direction="horizontal" gap={1.5} align="end">
            <Text type="label">{formatInr(product.priceInr)}</Text>
            {product.wasInr && (
              <Text type="supporting">
                <s>{formatInr(product.wasInr)}</s>
              </Text>
            )}
          </Stack>

          <Stack direction="horizontal" gap={1.5} align="center">
            <Avatar name={product.maker.name} size="xsm" />
            <Text type="supporting">
              {product.maker.name}
              {product.postedAgo ? ` · ${product.postedAgo}` : ''}
            </Text>
          </Stack>

          {product.proof && <Text type="supporting">{product.proof}</Text>}
        </Stack>
      </Stack>
    </Card>
  );
}
