import { Grid } from '@astryxdesign/core/Grid';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Avatar } from '@astryxdesign/core/Avatar';
import type { Maker } from './types';

/** "Meet the makers" — the people the whole product is about. */
export function MakerRow({ makers }: { makers: ReadonlyArray<Maker> }) {
  return (
    <Grid columns={{ minWidth: 78, max: 6 }} gap={3}>
      {makers.map((maker) => (
        <Stack key={maker.id} direction="vertical" gap={1.5} align="center">
          <Avatar name={maker.name} size={72} />
          <Stack direction="vertical" gap={0} align="center">
            <Text type="label">{maker.name}</Text>
            <Text type="supporting">
              {maker.place} · {maker.followers}
            </Text>
          </Stack>
        </Stack>
      ))}
    </Grid>
  );
}
