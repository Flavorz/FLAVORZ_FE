import { Stack, StackItem } from '@astryxdesign/core/Stack';
import { Section } from '@astryxdesign/core/Section';
import { Grid } from '@astryxdesign/core/Grid';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { ThemedIsland } from './ThemedIsland';
import {
  ActivityTicker,
  CategoryRow,
  Leaderboards,
  MakerRow,
  ProductCard,
  ReelCard,
  SiteHeader,
  TierPanel,
  formatInr,
} from './flavorz';
import {
  ACTIVITY,
  CATEGORIES,
  FRESH,
  LEADERBOARDS,
  MAKERS,
  REELS,
  TIER,
  VIDEOS,
} from './flavorz/data';
import type { TenantConfig } from '../../lib/tenant/schema';

/** Section heading with an optional trailing link. */
function SectionHead({ title, note, action }: { title: string; note?: string; action?: string }) {
  return (
    <Stack direction="horizontal" gap={3} align="center">
      <Heading level={2}>{title}</Heading>
      {note && <Text type="supporting">{note}</Text>}
      {action && (
        <StackItem size="fill">
          <Stack direction="horizontal" justify="end">
            <Text type="supporting">{action}</Text>
          </Stack>
        </StackItem>
      )}
    </Stack>
  );
}

const PROMOS = [
  { tag: 'IN SEASON', title: 'Mango season is here', cta: 'Shop Mangoes' },
  {
    tag: 'ZERO COMMISSION',
    title: '100% of the price goes to the maker',
    body: 'You pay ₹220, Radha gets ₹220',
  },
  { tag: 'FESTIVE', title: 'Diwali boxes pre-order now' },
];

function HomeInner({ tenant }: { tenant: TenantConfig }) {
  return (
    <Stack direction="vertical" gap={0}>
      <SiteHeader tenant={tenant} />
      <ActivityTicker items={ACTIVITY} />

      <Section variant="transparent" paddingBlock={5} paddingInline={6}>
        <Stack direction="vertical" gap={6} maxWidth={1240} width="100%">
          <TierPanel name="Sarath R" tier={TIER} />

          <Grid columns={{ minWidth: 260, max: 3 }} gap={4}>
            {PROMOS.map((p, i) => (
              <Card key={p.tag} padding={4} variant={i === 0 ? 'muted' : 'default'} height="100%">
                <Stack direction="vertical" gap={2}>
                  <Text type="supporting" style={{ letterSpacing: '0.08em' }}>
                    {p.tag}
                  </Text>
                  <Heading level={3}>{p.title}</Heading>
                  {p.body && <Text type="supporting">{p.body}</Text>}
                  {p.cta && (
                    <Stack direction="horizontal">
                      <Button label={p.cta} variant="primary" size="sm" />
                    </Stack>
                  )}
                </Stack>
              </Card>
            ))}
          </Grid>

          <Divider />

          <Stack direction="vertical" gap={4}>
            <SectionHead title="Reels" action="See all reels" />
            <Grid columns={{ minWidth: 240, max: 4 }} gap={4}>
              {REELS.map((reel) => (
                <ReelCard key={reel.id} reel={reel} />
              ))}
            </Grid>
          </Stack>

          <Stack direction="vertical" gap={4}>
            <SectionHead title="Shop the pantry" />
            <CategoryRow categories={CATEGORIES} />
          </Stack>

          <Stack direction="vertical" gap={4}>
            <SectionHead title="What's fresh today" note="Live from the community" />
            <Grid columns={{ minWidth: 240, max: 4 }} gap={4}>
              {FRESH.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </Grid>
          </Stack>

          <Stack direction="vertical" gap={4}>
            <SectionHead title="Videos from the Kitchens" action="See all videos" />
            <Grid columns={{ minWidth: 300, max: 3 }} gap={4}>
              {VIDEOS.map((v) => (
                <Card key={v.id} padding={0} height="100%">
                  <Stack direction="vertical" gap={0} height="100%">
                    <Stack
                      direction="vertical"
                      gap={0}
                      padding={2}
                      minHeight={200}
                      style={{ backgroundColor: 'var(--color-background-muted)' }}
                    >
                      <Badge label={v.kind} variant="neutral" />
                      <StackItem size="fill">
                        <Stack direction="horizontal" align="end" height="100%">
                          <Button label="Watch" variant="secondary" size="sm" />
                        </Stack>
                      </StackItem>
                    </Stack>
                    <Stack direction="vertical" gap={1} padding={3}>
                      <Text type="body" as="p">
                        {v.title}
                      </Text>
                      <Text type="supporting">
                        {v.maker.name} · {v.watchMinutes} min watch · {v.cheered} cheered
                      </Text>
                      <Stack direction="horizontal" gap={2} align="center">
                        <Text type="supporting">
                          {v.product.name} · {v.product.size} · {formatInr(v.product.priceInr)}
                        </Text>
                        <StackItem size="fill">
                          <Stack direction="horizontal" justify="end">
                            <Button label="Buy" variant="primary" size="sm" />
                          </Stack>
                        </StackItem>
                      </Stack>
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Grid>
          </Stack>

          <Stack direction="vertical" gap={4}>
            <SectionHead
              title="Community leaders"
              note="This week. Scoring rules to come."
              action="See full leaderboard"
            />
            <Leaderboards boards={LEADERBOARDS} />
          </Stack>

          <Stack direction="vertical" gap={4}>
            <SectionHead title="Meet the makers" />
            <MakerRow makers={MAKERS} />
          </Stack>

          <Card padding={5} variant="muted" width="100%">
            <Stack direction="horizontal" gap={4} align="center">
              <StackItem size="fill">
                <Stack direction="vertical" gap={2}>
                  <Heading level={3}>Zero commission. 100% of the price goes to the maker.</Heading>
                  <Stack direction="horizontal">
                    <Button label="See on Flavorz →" variant="primary" size="sm" />
                  </Stack>
                </Stack>
              </StackItem>
              <Stack direction="horizontal" gap={3} align="center">
                <Stack direction="vertical" gap={0} align="center">
                  <Text type="supporting">You pay</Text>
                  <Text type="display-3">{formatInr(220)}</Text>
                </Stack>
                <Text type="large">→</Text>
                <Stack direction="vertical" gap={0} align="center">
                  <Text type="supporting">Radha gets</Text>
                  <Text type="display-3">{formatInr(220)}</Text>
                </Stack>
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </Section>

      <Section variant="muted" paddingBlock={6} paddingInline={6}>
        <Stack direction="vertical" gap={3} maxWidth={1240} width="100%">
          <Heading level={3}>{tenant.name}</Heading>
          <Grid columns={{ minWidth: 200, max: 4 }} gap={4}>
            <Stack direction="vertical" gap={1}>
              <Text type="label">Registered Office</Text>
              <Text type="supporting">
                CKGFlavorz FoodTech Pvt Ltd, 112 17th main road, MIG KHB Colony, 5th block,
                Koramangala, Bangalore 560095
              </Text>
            </Stack>
            <Stack direction="vertical" gap={1}>
              <Text type="label">Contact</Text>
              <Text type="supporting">info@theflavorz.com</Text>
              <Text type="supporting">+91 97425 57770</Text>
            </Stack>
            <Stack direction="vertical" gap={1}>
              <Text type="label">Quick links</Text>
              <Text type="supporting">Privacy Policy</Text>
              <Text type="supporting">Terms and Conditions</Text>
            </Stack>
            <Stack direction="vertical" gap={1}>
              <Text type="label">Other info</Text>
              <Text type="supporting">GSTN: 29AALCC8084A1ZH</Text>
              <Text type="supporting">CIN: U56290KA2024PTC187789</Text>
              <Text type="supporting">fssai License: 11224999000767</Text>
            </Stack>
          </Grid>
        </Stack>
      </Section>
    </Stack>
  );
}

export default function FlavorzHome({ tenant }: { tenant?: TenantConfig }) {
  return <ThemedIsland tenant={tenant}>{(t) => <HomeInner tenant={t} />}</ThemedIsland>;
}
