import { Card } from '@astryxdesign/core/Card';
import { Stack, StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Badge } from '@astryxdesign/core/Badge';
import { Avatar } from '@astryxdesign/core/Avatar';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { formatInr } from './format';
import type { ShopperTier } from './types';

/**
 * The welcome panel: who you are, what you have spent, how far to the next
 * tier. The progress bar is the gamification hook the design leads with.
 */
export function TierPanel({ name, tier }: { name: string; tier: ShopperTier }) {
  const remaining = Math.max(0, tier.nextTierAtInr - tier.spentInr);
  const pct = Math.min(100, Math.round((tier.spentInr / tier.nextTierAtInr) * 100));

  return (
    <Card padding={5} width="100%">
      <Stack direction="horizontal" gap={5} align="center" data-flavorz="tier-panel">
        <Stack direction="vertical" gap={1.5} align="center">
          <Avatar name={name} size="xl" />
          <Badge label={`${tier.name} shopper`} variant="neutral" />
        </Stack>

        <StackItem size="fill">
          <Stack direction="vertical" gap={2}>
            <Heading level={1}>Welcome back, {name.split(' ')[0]}</Heading>
            <Text type="supporting">Super Shopper league · this month</Text>
            <Text type="body" as="p">
              You've shopped {formatInr(tier.spentInr)}. Shop {formatInr(remaining)} more to reach{' '}
              {tier.nextTier}.
            </Text>

            {/*
              variant="neutral", not "accent": the accent variant's colour is
              compiled into the component as StyleX and resolves to Astryx's
              status blue, which no theme token or CSS override can reach.
              Neutral inherits the brand's own neutral ramp.
            */}
            <ProgressBar
              value={pct}
              max={100}
              variant="neutral"
              label={`Progress to ${tier.nextTier}`}
            />

            <Stack direction="horizontal" gap={4}>
              {tier.tiers.map((t) => (
                <Stack key={t.name} direction="vertical" gap={0}>
                  <Text type="label">{t.name}</Text>
                  <Text type="supporting">{formatInr(t.atInr)}</Text>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </StackItem>
      </Stack>
    </Card>
  );
}
